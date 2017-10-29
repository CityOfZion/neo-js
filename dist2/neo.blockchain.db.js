const _ = require('lodash')
const mongoose = require('mongoose')
const Utils = require('./neo.blockchain.utils')

const Db = function (connectionInfo, options = {}) {
  // Properties and default values
  this.blockSchema = this._getBlockSchema()
  this.transactionSchema = this._getTransactionSchema()
  this.addressSchema = this._getAddressSchema()

  console.log('connectionInfo.collections.blocks:', connectionInfo.collections.blocks)
  
  this.blockModel = mongoose.model(connectionInfo.collections.blocks, this.blockSchema)
  this.transactionModel = mongoose.model(connectionInfo.collections.transactions, this.transactionSchema),
  this.addressModel = mongoose.model(connectionInfo.collections.addresses, this.addressSchema),
  
  // Bootstrap
  // this.module = {
  //   blocks: mongoose.model(connectionInfo.collections.blocks, this.blockSchema),
  //   transactions: mongoose.model(connectionInfo.collections.transactions, this.transactionSchema),
  //   addresses: mongoose.model(connectionInfo.collections.addresses, this.addressSchema),
  //   node: undefined
  // }
  // this._initLocalNode()

  // Explicit connect to localhost DB
  mongoose.connect('mongodb://localhost/ipsum') // TODO: use connectionInfo
}

/**
 * Default options for DB client.
 * @public
 */
Db.Defaults = {
}

Db.prototype = {
  // getLocalNode: function () {
  //   return new Error('Not implemented')
  // },

  // -- Endpoints

  // getBalance

  // getAssetBalance

  // getExpandedTX

  // getTX

  getBlock: function (index) {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({ index })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('Block not found'))
          }
          resolve(res)
        })
    })
  },

  getBlockCount: function () {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({}, 'index')
        .sort('-index')
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

  // -- Private methods

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

  _getAddressSchema: function () {
    return new mongoose.Schema({
      address: { type: 'String', unique: true, required: true, dropDups: true },
      asset: 'String',
      type: 'String',
      assets: [],
      history: []
    })
  },

  // _initLocalNode: function () {
  //   this.module.node = function () {
  //     this.domain = 'localhost'
  //     this.active = true
  //     this.latency = 0
  //     this.blockHeight = 0
  //     this.index = -1
  //     this.connections = 0
  //     this.pendingRequests = 0
  //     this.unlinkedBlocks = []
  //     this.assets = []
  //     const node = this
  //   }

  //   this.module.node.prototype = {
  //   }
  // },
}

module.exports = Db
