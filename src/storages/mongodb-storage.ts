import { EventEmitter } from 'events'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge, map, takeRight, includes, find } from 'lodash'
import { Mongoose, Schema } from 'mongoose'
import { MongodbValidator } from '../validators/mongodb-validator'

const mongoose = new Mongoose()
mongoose.Promise = global.Promise // Explicitly supply promise library (http://mongoosejs.com/docs/promises.html)

const MODULE_NAME = 'MongodbStorage'
const DEFAULT_OPTIONS: MongodbStorageOptions = {
  connectOnInit: true,
  reviewIndexesOnConnect: false,
  userAgent: 'Unknown',
  collectionNames: {
    blocks: 'blocks',
    blockMetas: 'block_metas',
    transactions: 'transactions',
    assets: 'assets',
  },
  loggerOptions: {},
}

export interface MongodbStorageOptions {
  connectOnInit?: boolean
  reviewIndexesOnConnect?: boolean
  connectionString?: string
  userAgent?: string
  collectionNames?: {
    blocks?: string
    blockMetas?: string
    transactions?: string
    assets?: string
  }
  loggerOptions?: LoggerOptions
}

export class MongodbStorage extends EventEmitter {
  private _isReady = false
  private blockModel: any
  private blockMetaModel: any
  private options: MongodbStorageOptions
  private logger: Logger

  constructor(options: MongodbStorageOptions = {}) {
    super()

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.blockModel = this.getBlockModel()
    this.blockMetaModel = this.getBlockMetaModel()
    this.initConnection()

    // Event handlers
    this.on('ready', this.readyHandler.bind(this))

    this.logger.debug('constructor completes.')
  }

  isReady(): boolean {
    return this._isReady
  }

  getBlockCount(): Promise<number> {
    this.logger.debug('getBlockCount triggered.')
    return new Promise((resolve, reject) => {
      this.blockModel
        .findOne({}, 'height')
        .sort({ height: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            this.logger.warn('blockModel.findOne() execution failed.')
            return reject(err)
          }
          if (!res) {
            this.logger.info('blockModel.findOne() executed by without response data, hence no blocks available.')
            return resolve(0)
          }
          return resolve(res.height)
        })
    })
  }

  setBlockCount(height: number): Promise<void> {
    throw new Error('Not implemented.')
  }

  countBlockRedundancy(height: number): Promise<number> {
    this.logger.debug('countBlockRedundancy triggered. height:', height)

    return new Promise((resolve, reject) => {
      this.blockModel.count({ height }).exec((err: any, res: number) => {
        if (err) {
          this.logger.warn('blockModel.count() execution failed. error:', err.message)
          return reject(err)
        }
        return resolve(res as number)
      })
    })
  }

  getBlock(height: number): Promise<object> {
    this.logger.debug('getBlock triggered. height:', height)

    return new Promise((resolve, reject) => {
      this.getBlockDocument(height)
        .then((doc: any) => {
          if (!doc.payload) {
            return reject(new Error('Invalid document result.'))
          }
          return resolve(doc.payload)
        })
        .catch((err: any) => reject(err))
    })
  }

  getBlocks(height: number): Promise<object[]> {
    this.logger.debug('getBlocks triggered. height:', height)

    return new Promise((resolve, reject) => {
      this.getBlockDocuments(height)
        .then((docs: object[]) => {
          if (docs.length === 0) {
            return resolve([])
          }
          const result = map(docs, (item: any) => item.payload)
          return resolve(result)
        })
        .catch((err: any) => reject(err))
    })
  }

  getTransaction(transactionId: string): Promise<object> {
    this.logger.debug('getTransaction triggered.')

    return new Promise((resolve, reject) => {
      this.getBlockDocumentByTransactionId(transactionId)
        .then((doc: any) => {
          if (!doc) {
            return reject(new Error('No result found.'))
          }
          const transaction = find(doc.payload.tx, (t: any) => t.txid === transactionId)
          return resolve(transaction)
        })
        .catch((err: any) => reject(err))
    })
  }

  setBlock(height: number, block: object, options: object = {}): Promise<void> {
    this.logger.debug('setBlock triggered.')

    const data = {
      height,
      source: (options as any).source,
      userAgent: (options as any).userAgent, // Source RPC's user agent
      createdBy: this.options.userAgent, // neo-js's user agent
      payload: block,
    }
    return new Promise((resolve, reject) => {
      this.blockModel(data).save((err: any) => {
        if (err) {
          this.logger.warn('blockModel().save() execution failed.')
          reject(err)
        }
        resolve()
      })
    })
  }

  pruneBlock(height: number, redundancySize: number): Promise<void> {
    this.logger.debug('pruneBlock triggered. height: ', height, 'redundancySize:', redundancySize)

    return new Promise((resolve, reject) => {
      this.getBlockDocuments(height)
        .then((docs: object[]) => {
          this.logger.debug('getBlockDocuments() succeed. docs.length:', docs.length)
          if (docs.length > redundancySize) {
            const takeCount = docs.length - redundancySize
            const toPrune = takeRight(docs, takeCount)
            toPrune.forEach((doc: any) => {
              this.logger.debug('Removing document id:', doc._id)
              this.blockModel.remove({ _id: doc._id }).exec((err: any, res: any) => {
                if (err) {
                  this.logger.debug('blockModel.remove() execution failed. error:', err.message)
                } else {
                  this.logger.debug('blockModel.remove() execution succeed.')
                }
              })
            })
          }
          resolve()
        })
        .catch((err: any) => reject(err))
    })
  }

  analyzeBlocks(startHeight: number, endHeight: number): Promise<object[]> {
    this.logger.debug('analyzeBlockHeight triggered.')
    /**
     * Example result:
     * [
     *   { _id: 1, count: 1 },
     *   { _id: 2, count: 4 },
     *   ...
     * ]
     */
    return new Promise((resolve, reject) => {
      const aggregatorOptions = [
        {
          $group: {
            _id: '$height',
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            _id: {
              // This '_id' is now referring to $height as designated in $group
              $gte: startHeight,
              $lte: endHeight,
            },
          },
        },
      ]

      this.blockModel
        .aggregate(aggregatorOptions)
        .allowDiskUse(true)
        .exec((err: Error, res: any) => {
          if (err) {
            return reject(err)
          }

          return resolve(res)
        })
    })
  }

  getBlockMetaCount(): Promise<number> {
    this.logger.debug('getBlockMetaCount triggered.')

    return new Promise((resolve, reject) => {
      this.blockMetaModel.count({}).exec((err: any, res: any) => {
        if (err) {
          this.logger.warn('blockMetaModel.findOne() execution failed.')
          return reject(err)
        }
        return resolve(res)
      })
    })
  }

  getHighestBlockMetaHeight(): Promise<number> {
    this.logger.debug('getHighestBlockMetaHeight triggered.')

    return new Promise((resolve, reject) => {
      this.getHighestBlockMeta()
        .then((res: any) => {
          if (res) {
            return resolve(res.height)
          }
          return resolve(0)
        })
        .catch((err) => {
          return resolve(0)
        })
    })
  }

  getHighestBlockMeta(): Promise<object | undefined> {
    this.logger.debug('getHighestBlockMeta triggered.')

    return new Promise((resolve, reject) => {
      this.blockMetaModel
        .findOne()
        .sort({ height: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            this.logger.warn('blockMetaModel.findOne() execution failed.')
            return reject(err)
          }
          if (!res) {
            this.logger.info('blockMetaModel.findOne() executed by without response data, hence no blocks available.')
            return resolve(undefined)
          }
          return resolve(res)
        })
    })
  }

  setBlockMeta(blockMeta: object): Promise<void> {
    this.logger.debug('setBlockMeta triggered.')

    const data = {
      createdBy: this.options.userAgent, // neo-js's user agent
      ...blockMeta,
    }
    return new Promise((resolve, reject) => {
      this.blockMetaModel(data).save((err: any) => {
        if (err) {
          this.logger.info('blockMetaModel().save() execution failed.')
          reject(err)
        }
        resolve()
      })
    })
  }

  analyzeBlockMetas(startHeight: number, endHeight: number): Promise<object[]> {
    this.logger.debug('analyzeBlockMetas triggered.')

    /**
     * Example Result:
     * [
     *  { _id: 5bff81ccbbd4fc5d6f3352d5, height: 95, apiLevel: 1 },
     *  { _id: 5bff81ccbbd4fc5d6f3352d9, height: 96, apiLevel: 1 },
     *  ...
     * ]
     */
    return new Promise((resolve, reject) => {
      this.blockMetaModel
        .find(
          {
            height: {
              $gte: startHeight,
              $lte: endHeight,
            },
          },
          'height apiLevel'
        )
        .exec((err: any, res: any) => {
          if (err) {
            this.logger.warn('blockMetaModel.find() execution failed.')
            return reject(err)
          }
          return resolve(res)
        })
    })
  }

  removeBlockMetaByHeight(height: number): Promise<void> {
    this.logger.debug('removeBlockMetaByHeight triggered. height: ', height)

    return new Promise((resolve, reject) => {
      this.blockMetaModel.remove({ height }).exec((err: any, res: any) => {
        if (err) {
          this.logger.debug('blockMetaModel.remove() execution failed. error:', err.message)
          return reject(err)
        } else {
          this.logger.debug('blockMetaModel.remove() execution succeed.')
          return resolve()
        }
      })
    })
  }

  disconnect(): Promise<void> {
    this.logger.debug('disconnect triggered.')
    return mongoose.disconnect()
  }

  private readyHandler(payload: any) {
    this.logger.debug('readyHandler triggered.')
    if (this.options.reviewIndexesOnConnect) {
      this.reviewIndexes()
    }
  }

  private validateOptionalParameters() {
    // TODO
  }

  private getBlockModel() {
    const schema = new Schema(
      {
        height: Number,
        createdBy: String,
        source: String,
        userAgent: String,
        payload: {
          hash: String,
          size: Number,
          version: Number,
          previousblockhash: String,
          merkleroot: String,
          time: Number,
          index: { type: 'Number', required: true },
          nonce: String,
          nextconsensus: String,
          script: {
            invocation: String,
            verification: String,
          },
          tx: [],
          confirmations: Number,
          nextblockhash: String,
        },
      },
      { timestamps: true }
    )

    return mongoose.models[this.options.collectionNames!.blocks!] || mongoose.model(this.options.collectionNames!.blocks!, schema)
  }

  private getBlockMetaModel() {
    const schema = new Schema(
      {
        height: { type: 'Number', unique: true, required: true, dropDups: true },
        time: Number,
        size: Number,
        generationTime: Number,
        transactionCount: Number,
        createdBy: String,
        apiLevel: Number,
      },
      { timestamps: true }
    )

    const name = this.options.collectionNames!.blockMetas!
    return mongoose.models[name] || mongoose.model(name, schema)
  }

  private initConnection() {
    if (this.options.connectOnInit) {
      this.logger.debug('initConnection triggered.')
      MongodbValidator.validateConnectionString(this.options.connectionString!)

      mongoose
        .connect(
          this.options.connectionString!,
          { useMongoClient: true }
        )
        .then(() => {
          this.logger.info('MongoDB connected.')
          this.setReady()
        })
        .catch((err: any) => {
          this.logger.error('Error establish MongoDB connection.')
          throw err
        })
    }
  }

  private setReady() {
    this._isReady = true
    this.emit('ready')
  }

  private reviewIndexes(): Promise<void> {
    this.logger.debug('Proceed to review indexes...')
    this.emit('reviewIndexes:init')

    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.reviewIndexForBlockHeight())
        .then(() => this.reviewIndexForTransactionId())
        .then(() => {
          this.logger.debug('Review indexes succeed.')
          this.emit('reviewIndexes:complete', { isSuccess: true })
          return resolve()
        })
        .catch((err: any) => {
          this.logger.debug('reviewIndexes failed. Message:', err.message)
          this.emit('reviewIndexes:complete', { isSuccess: false })
          return resolve()
        })
    })
  }

  private reviewIndexForBlockHeight(): Promise<void> {
    this.logger.debug('reviewIndexForBlockHeight triggered.')

    const key = 'height_1_createdAt_-1'
    const keyObj = { height: 1, createdAt: -1 }
    return this.reviewIndex(this.blockModel, key, keyObj)
  }

  private reviewIndexForTransactionId(): Promise<void> {
    this.logger.debug('reviewIndexForTransactionId triggered.')

    const key = 'payload.tx.txid_1'
    const keyObj = { 'payload.tx.txid': 1 }
    return this.reviewIndex(this.blockModel, key, keyObj)
  }

  private reviewIndex(model: any, key: string, keyObj: object): Promise<void> {
    this.logger.debug('reviewIndex triggered.')

    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.hasIndex(model, key))
        .then((hasRequiredIndex: boolean) => {
          if (hasRequiredIndex) {
            // Determined that there's no need to create index
            throw new Error('SKIP_INDEX')
          }
          this.logger.info(`Generating index [${key}]...`)
          return Promise.resolve()
        })
        .then(() => this.createIndex(model, keyObj))
        .then(() => {
          this.logger.info(`Index [${key}] generation complete.`)
          return resolve()
        })
        .catch((err: any) => {
          if (err.message === 'SKIP_INDEX') {
            this.logger.info(`Index [${key}] already available. No action needed.`)
            return resolve()
          } else {
            this.logger.info(`Index [${key}] generation failed. Message:`, err.message)
            return reject(err)
          }
        })
    })
  }

  private hasIndex(model: any, key: string): Promise<boolean> {
    this.logger.debug('hasIndex triggered. key:', key)

    return new Promise((resolve, reject) => {
      model.collection
        .getIndexes()
        .then((res: any) => {
          this.logger.debug('collection.getIndexes succeed. res:', res)
          const keys = Object.keys(res)
          const result = includes(keys, key)
          return resolve(result)
        })
        .catch((err: any) => reject(err))
    })
  }

  private createIndex(model: any, keyObj: object): Promise<void> {
    this.logger.debug('createIndex triggered.')

    return new Promise((resolve, reject) => {
      model.collection
        .createIndex(keyObj)
        .then((res: any) => resolve())
        .catch((err: any) => reject(err))
    })
  }

  private getBlockDocument(height: number): Promise<object> {
    this.logger.debug('getBlockDocument triggered. height:', height)

    /**
     * NOTE:
     * It is assumed that there may be multiple matches and will pick 'latest created' one as truth.
     */
    return new Promise((resolve, reject) => {
      this.blockModel
        .findOne({ height })
        .sort({ createdAt: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            this.logger.warn('blockModel.findOne() execution failed. error:', err.message)
            return reject(err)
          }
          if (!res) {
            return reject(new Error('No result found.'))
          }
          return resolve(res)
        })
    })
  }

  private getBlockDocuments(height: number): Promise<object[]> {
    this.logger.debug('getBlockDocuments triggered. height:', height)

    return new Promise((resolve, reject) => {
      this.blockModel
        .find({ height })
        .sort({ createdAt: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            this.logger.warn('blockModel.find() execution failed. error:', err.message)
            return reject(err)
          }
          if (!res) {
            // TODO: Verify if res is array
            return resolve([])
          }
          return resolve(res)
        })
    })
  }

  private getBlockDocumentByTransactionId(transactionId: string): Promise<object> {
    this.logger.debug('getBlockDocumentByTransactionId triggered. transactionId:', transactionId)

    return new Promise((resolve, reject) => {
      this.blockModel
        .findOne({
          'payload.tx': {
            $elemMatch: {
              txid: transactionId,
            },
          },
        })
        .exec((err: any, res: any) => {
          if (err) {
            this.logger.warn('blockModel.findOne() execution failed. error:', err.message)
            return reject(err)
          }
          return resolve(res)
        })
    })
  }
}
