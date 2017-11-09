/* eslint handle-callback-err: "off" */
const _ = require('lodash')
const mongoose = require('mongoose')
const Utils = require('./neo.blockchain.utils')
const Logger = Utils.logger

/**
 * MongoDB Data Access
 * @todo Re-evaluate node-like properties in this class.
 * @class
 * @public
 * @param {Object} connectionInfo
 * @param {Object} options 
 */
const MongoDA = function (connectionInfo, options = {}) {
  // Properties and default values
  this.connectionInfo = connectionInfo
  this.options = _.assign({}, MongoDA.Defaults, options)
  this.url = 'localhost'

  // TODO: node related properties shouldn't be here...
  this.blockHeight = 0
  this.index = -1
  this.connections = 0
  this.pendingRequests = 0
  this.unlinkedBlocks = []
  this.assets = []
  this.assetsFlat = []

  this.blockSchema = this._getBlockSchema()
  this.transactionSchema = this._getTransactionSchema()
  this.addressSchema = this._getAddressSchema()

  this.blockModel = mongoose.model(connectionInfo.collections.blocks, this.blockSchema)
  this.transactionModel = mongoose.model(connectionInfo.collections.transactions, this.transactionSchema)
  this.addressModel = mongoose.model(connectionInfo.collections.addresses, this.addressSchema)

  // Bootstrap
  Logger.setLevel(this.options.verboseLevel)
  mongoose.Promise = global.Promise // Explicitly proide own promise library (http://mongoosejs.com/docs/promises.html)
  this._initUpdateAssetList()

  // Explicit connect to localhost DB
  if (this.options.connectOnInit) {
    this._initConnection()
  }
}

/**
 * Default options.
 * @public
 */
MongoDA.Defaults = {
  verboseLevel: 2,
  connectOnInit: true
}

MongoDA.prototype = {

  // -- Endpoints

  // getBalance

  // getAssetBalance

  // getExpandedTX

  // getTX

  /**
   * @todo Verify if the implementation is working
   */
  getBestBlockHash: function () {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({})
        .sort({ index: -1 })
        .exec((err, res) => {
          if (err) {
            Logger.trace()
            reject(err)
          }
          if (!res) {
            Logger.trace()
            reject(new Error('Block not found'))
          }
          resolve(res)
        })
    })
  },

  getBlock: function (index) {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({ index })
        .exec((err, res) => {
          if (err) {
            Logger.trace()
            reject(err)
          }
          if (!res) {
            Logger.trace()
            reject(new Error('Block not found'))
          }
          resolve(res)
        })
    })
  },

  /**
   * @todo Verify if the implementation is working
   */
  getBlockByHash: function (hash) {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({ hash })
        .exec((err, res) => {
          if (err) {
            Logger.trace()
            reject(err)
          }
          if (!res) {
            Logger.trace()
            reject(new Error('Block not found'))
          }
          resolve(res)
        })
    })
  },

  /**
   * @todo Verify if the implementation is working
   */
  getBlockCount: function () {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({}, 'index')
        .sort({ index: -1 })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('Unexpected response'))
          }
          resolve(res.index + 1)
        })
    })
  },

  /**
   * @todo Verify if the implementation is working
   */
  getRawTransaction: function (txid) {
    return new Promise((resolve, reject) => {
      this.transactionModel.findOne({ txid })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('Transaction not found'))
          }
          resolve(res)
        })
    })
  },

  /**
   * @todo Duplicate block detection and handling
   * @todo Duplicate transaction detection and handling
   */
  saveBlock: function (newBlock) {
    return new Promise((resolve, reject) => {
      // Store the raw block
      newBlock = this._delintBlock(newBlock)
      this.blockModel(newBlock).save((err) => {
        if (err) {
          Logger.trace('[da.mongodb] Failed saving block model. Rejected.')
          reject(err)
        }

        // Store the raw transaction
        newBlock.tx.forEach((tx) => {
          tx.blockIndex = newBlock.index
          tx.vout.forEach((d) => {
            if (this.assetsFlat.indexOf(d.asset) === -1) {
              Logger.info('[da.mongodb] Saving an address...')
              this.addressModel({ address: d.asset, asset: d.asset, type: 'a', assets: [] }).save()
            }
          })

          this.transactionModel(tx).save((err) => {
            if (err) {
              Logger.trace()
              Logger.error('[da.mongodb] saveBlock transactionModel.save() error:', err)
            }
          })
        })

        /**
         * Because we asynchronously sync the blockchain,
         * we need to keep track of the blocks that have been stored
         * (higher indices could arrive before the lower ones)
         * This code maintains the local blockheight by tracking
         * 'linked' and 'unlinked'(but stored) blocks
         */
        if (newBlock.index > this.index) {
          this.unlinkedBlocks.push(newBlock.index)
          let linkIndex = -1
          while (true) {
            linkIndex = this.unlinkedBlocks.indexOf(this.index + 1)
            if (linkIndex !== -1) {
              this.unlinkedBlocks.splice(linkIndex, 1)
              this.index++
              this.blockHeight++
            } else {
              break
            }
          }
        }
        resolve()
      })
    })
  },

  /**
   * @todo Verify if the implementation is working
   */
  saveTransaction: function (tx) {
    return new Promise((resolve, reject) => {
      this.transactionModel(tx).save((err) => {
        if (err) {
          Logger.trace()
          reject(err)
        }
      })

      resolve()
    })
  },

  // -- Specialised endpoints

  /**
   * @todo Verify if the implementation is working
   */
  getAllBlocks: function () {
    return new Promise((resolve, reject) => {
      this.blockModel.find({}, 'index')
        .sort('index')
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('Blocks not found'))
          }
          resolve(res)
        })
    })
  },

  // -- Private methods

  /**
   * @private
   */
  _getBlockSchema: function () {
    return new mongoose.Schema({
      hash: String,
      size: Number,
      version: Number,
      previousblockhash: String,
      merkleroot: String,
      time: Number,
      index: { type: 'Number', unique: true, required: true, dropDups: true },
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
  },

  /**
   * @private
   */
  _getTransactionSchema: function () {
    return new mongoose.Schema({
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
      scripts: []
    })
  },

  /**
   * @private
   */
  _getAddressSchema: function () {
    return new mongoose.Schema({
      address: { type: 'String', unique: true, required: true, dropDups: true },
      asset: 'String',
      type: 'String',
      assets: [],
      history: []
    })
  },

  /**
   * @private
   * @param {Object} block
   * @return {Object}
   */
  _delintBlock: function (block) {
    block.hash = Utils.normaliseHash(block.hash)
    block.previousblockhash = Utils.normaliseHash(block.previousblockhash)
    block.merkleroot = Utils.normaliseHash(block.merkleroot)
    block.tx.forEach((tx) => {
      tx.txid = Utils.normaliseHash(tx.txid)
      tx.sys_fee = parseFloat(tx.sys_fee)
      tx.net_fee = parseFloat(tx.net_fee)

      tx.vout.forEach((vout) => {
        vout.asset = Utils.normaliseHash(vout.asset)
        vout.value = parseFloat(vout.value)
      })
    })
    return block
  },

  /**
   * @todo Verify if the implementation is working
   * @private
   */
  _updateAssetList: function () {
    Logger.info('_updateAssetList triggered.')
    this.addressModel.find({ type: 'a' }, 'asset')
      .exec((err, res) => {
        this.assets = res
        this.assetsFlat = _.map(res, 'asset')
        Logger.info('assetsFlat:', this.assetsFlat)
      })
  },

  /**
   * @todo configurable interval value
   * @private
   */
  _initUpdateAssetList: function () {
    this._updateAssetList()
    setInterval(this._updateAssetList.bind(this), 10000)
  },

  /**
   * @todo Verify if mongodb server is available/reachable
   * @private
   */
  _initConnection: function () {
    const conn = `mongodb://${this.connectionInfo.server}/${this.connectionInfo.database}`

    mongoose.connect(conn, { useMongoClient: true }, (ignore, connection) => {
      connection.onOpen()
    })
      .then(() => { Logger.info('mongoose connected. connection string:', conn) })
      .catch(console.error)
  }
}

module.exports = MongoDA
