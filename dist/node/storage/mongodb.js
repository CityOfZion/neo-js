/* eslint handle-callback-err: "off" */
const mongoose = require('mongoose')
const HashHelper = require('../../common/hash-helper')
const Logger = require('../../common/logger')

/**
 * @class MongodbStorage
 * @param {Object} options
 * @param {boolean} options.connectOnInit
 * @param {string} options.connectionString
 * @param {Object} options.collectionNames
 * @param {string} options.collectionNames.blocks
 * @param {string} options.collectionNames.transactions
 * @param {string} options.collectionNames.addresses
 * @param {Object} options.logger
 * @param {Object} options.loggerOptions
 */
class MongodbStorage {
  constructor (options = {}) {
    // -- Properties
    /** @type {Object} */
    this.blockModel = undefined
    /** @type {Object} */
    this.transactionModel = undefined
    /** @type {Object} */
    this.addressModel = undefined
    /** @type {Object} */
    this.defaultOptions = {
      connectOnInit: true,
      connectionString: 'mongodb://localhost/neo',
      collectionNames: {
        blocks: 'b_neo_t_blocks',
        transactions: 'b_neo_t_transactions',
        addresses: 'b_neo_t_addresses'
      },
      logger: undefined,
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.initLogger()
    this.logger.debug('constructor triggered.')
    this.blockModel = this.getBlockModel()
    this.transactionModel = this.getTransactionModel()
    this.addressModel = this.getAddressModel()

    mongoose.Promise = global.Promise // Explicitly supply promise library (http://mongoosejs.com/docs/promises.html)
    if (this.connectOnInit) {
      this.initConnection()
    }
  }

  /**
   * @private
   * @returns {void}
   */
  initLogger () {
    this.logger = new Logger('MongodbStorage', this.loggerOptions)
  }

  /**
   * @static
   * @private
   * @param {Object} block
   * @returns {Object}
   */
  delintBlock (block) {
    block.hash = HashHelper.normalize(block.hash)
    block.previousblockhash = HashHelper.normalize(block.previousblockhash)
    block.merkleroot = HashHelper.normalize(block.merkleroot)
    block.tx.forEach((tx) => {
      tx.txid = HashHelper.normalize(tx.txid)
      tx.sys_fee = parseFloat(tx.sys_fee)
      tx.net_fee = parseFloat(tx.net_fee)

      tx.vout.forEach((vout) => {
        vout.asset = HashHelper.normalize(vout.asset)
        vout.value = parseFloat(vout.value)
      })
    })
    return block
  }

  /**
   * @public
   * @param {string} txid
   * @returns {Promise.<Object>}
   */
  getTX (txid) {
    return new Promise((resolve, reject) => {
      this.transactionModel.findOne({ txid })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * List transactions of a specific wallet.
   * @public
   * @param {string} address
   * @returns {Promise.<Object>}
   */
  getTransactions (address) {
    return new Promise((resolve, reject) => {
      this.transactionModel.find({
        'vout.address': address,
        $or: [
          {type: 'ContractTransaction'},
          {type: 'InvocationTransaction'},
          {type: 'ClaimTransaction'}
        ]
      })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @param {number} index
   * @returns {Promise.<Object>}
   */
  getBlock (index) {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({ index })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @param {string} hash
   * @returns {Promise.<Object>}
   */
  getBlockByHash (hash) {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({ hash })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @returns {Promise.<Number>}
   */
  getBlockCount () {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({}, 'index')
        .sort({ index: -1 })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            res = { index: -1 }
          }
          const height = res.index + 1
          resolve(height)
        })
    })
  }

  /**
   * @public
   * @returns {Promise.<String>}
   */
  getBestBlockHash () {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({}, 'hash')
        .sort({ index: -1 })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @param {string} hash
   * @returns {Promise.<Object>}
   */
  getAsset (hash) {
    return new Promise((resolve, reject) => {
      this.addressModel.findOne({ type: 'a', address: hash })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @returns {Promise.<Array>}
   */
  getAssetList () {
    return new Promise((resolve, reject) => {
      this.addressModel.find({ type: 'a' })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @param {string} address
   * @param {string} assetHash
   * @param {number} [startBlock = 0]
   * @returns {Promise.<Array>}
   */
  getAssetListByAddress (address, assetHash, startBlock = 0) {
    return new Promise((resolve, reject) => {
      this.transactionModel.find({
        'vout.address': address,
        $or: [
          {type: 'ContractTransaction'},
          {type: 'InvocationTransaction'},
          {type: 'ClaimTransaction'}
        ],
        'vout.asset': assetHash,
        blockIndex: { $gte: startBlock }
      })
        .sort('blockIndex')
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @param {Object} asset
   * @returns {Promise}
   */
  saveAsset (asset) {
    return new Promise((resolve, reject) => {
      this.addressModel(asset).save((err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * @public
   * @param {Object} block
   * @returns {Promise}
   */
  saveBlock (block) {
    return new Promise((resolve, reject) => {
      block = this.delintBlock(block)
      this.blockModel(block).save((err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * @public
   * @param {string} hash
   * @param {Object} assetState
   * @returns {Promise}
   */
  saveAssetState (hash, assetState) {
    return new Promise((resolve, reject) => {
      this.getAsset(hash)
        .then((res) => {
          res.state = assetState
          this.addressModel(res).save((err) => {
            if (err) {
              reject(err)
            }
            resolve()
          })
        })
        .catch((err) => reject(err))
    })
  }

  /**
   * @public
   * @param {Object} tx
   * @returns {Promise}
   */
  saveTransaction (tx) {
    return new Promise((resolve, reject) => {
      this.transactionModel(tx).save((err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * @public
   * @param {Object} tx
   * @returns {Promise}
   */
  updateTransaction (tx) {
    return new Promise((resolve, reject) => {
      this.transactionModel.update({txid: tx.txid}, tx, (err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  /**
   * @public
   * @param {string} hash
   * @returns {Promise.<Object>}
   */
  getAddress (hash) {
    return new Promise((resolve, reject) => {
      this.addressModel.findOne({ address: hash })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @param {Object} address
   * @returns {Promise.<Object>}
   */
  saveAddress (address) {
    return new Promise((resolve, reject) => {
      this.addressModel(address)
        .save((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  /**
   * @public
   * @param {string} addressHash
   * @param {string} assetHash
   * @param {number} balance
   * @param {number} index
   * @returns {Promise.<Object>}
   */
  updateBalance (addressHash, assetHash, balance, index) {
    return new Promise((resolve, reject) => {
      this.addressModel.update({ address: addressHash, 'assets.asset': assetHash }, {
        'assets.$.balance': balance,
        'assets.$.index': index
      }).exec((err, res) => {
        if (err) {
          reject(err)
        }

        if (res.n === 0) {
          const result = { asset: assetHash, balance: balance, index: index, type: 'a' }
          this.addressModel.update({ address: addressHash }, { $push: {assets: result} })
            .exec((err, res) => { // Resolve anyway
              resolve(res)
            })
        } else {
          resolve(res)
        }
      })
    })
  }

  /**
   * Verifies local blockchain integrity over a block range.
   * @public
   * @param {string} start - The start index of the block range to verify.
   * @param {number} end - The end index of the block range to verify.
   * @returns {Promise.<Array>} An array containing the indices of the missing blocks.
   */
  verifyBlocks (start, end) {
    return new Promise((resolve, reject) => {
      let missing = []
      let pointer = start - 1

      this.logger.info('Blockchain Verification: Scanning')

      let stream = this.blockModel
        .find({index: {$gte: start, $lte: end}}, 'index').sort('index')
        .cursor()

      stream.on('data', (d) => {
        while (true) {
          pointer++
          if (d.index === pointer) {
            break
          } else {
            missing.push(pointer)
          }
        }
      })
      stream.on('end', () => {
        resolve(missing)
      })
    })
  }

  /**
   * Verifies local blockchain integrity over assets.
   * @public
   * @returns {Promise.<Array>} An array containing the indices of the invalid assets.
   */
  verifyAssets () {
    return new Promise((resolve, reject) => {
      let missing = []
      let stream = this.addressModel
        .find({ type: 'a' }, 'address state')
        .cursor()

      stream.on('data', (d) => {
        if (!d.state) {
          missing.push(d.address)
        }
      })
      stream.on('end', () => {
        resolve(missing)
      })
    })
  }

  /**
   * @private
   * @returns {void}
   */
  initConnection () {
    mongoose.connect(this.connectionString, { useMongoClient: true }, (ignore, connection) => {
      connection.onOpen()
    })
      .then(() => {
        this.logger.info('mongoose connected.')
      })
      .catch((err) => {
        this.logger.error('Error establish MongoDB connection.')
        this.logger.info('Error:', err)
      })
  }

  /**
   * @private
   * @returns {Object}
   */
  getBlockModel () {
    const schema = new mongoose.Schema({
      hash: String,
      size: Number,
      version: Number,
      previousblockhash: String,
      merkleroot: String,
      time: Number,
      index: {type: 'Number', unique: true, required: true, dropDups: true},
      nonce: String,
      nextconsensus: String,
      script: {
        invocation: String,
        verification: String
      },
      tx: [],
      confirmations: Number,
      nextblockhash: String
    })

    return mongoose.models[this.collectionNames.blocks] || mongoose.model(this.collectionNames.blocks, schema)
  }

  /**
   * @private
   * @returns {Object}
   */
  getTransactionModel () {
    const schema = new mongoose.Schema({
      txid: { type: 'String', unique: true, required: true, dropDups: true, index: true },
      size: Number,
      type: { type: 'String', index: true },
      version: Number,
      attributes: [],
      vin: [],
      vout: [],
      sys_fee: Number,
      net_fee: Number,
      blockIndex: { type: 'Number', index: true },
      scripts: [],
      script: String
    })

    return mongoose.models[this.collectionNames.transactions] || mongoose.model(this.collectionNames.transactions, schema)
  }

  /**
   * @private
   * @returns {Object}
   */
  getAddressModel () {
    const schema = new mongoose.Schema({
      address: { type: 'String', unique: true, required: true, dropDups: true },
      asset: 'String',
      type: 'String',
      assets: [],
      history: [],
      state: mongoose.Schema.Types.Mixed
    })

    return mongoose.models[this.collectionNames.addresses] || mongoose.model(this.collectionNames.addresses, schema)
  }
}

module.exports = MongodbStorage
