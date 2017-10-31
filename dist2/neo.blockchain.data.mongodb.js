const _ = require('lodash')
const mongoose = require('mongoose')
const Utils = require('./neo.blockchain.utils')

/**
 * MongoDB Data Access
 * @class
 * @public
 * @param {Object} options 
 */
const MongoDA = function (connectionInfo, options = {}) {
  // Properties and default values
  this.connectionInfo = connectionInfo
  this.options = _.assign({}, MongoDA.Defaults, options)

  this.blockSchema = this._getBlockSchema()
  this.transactionSchema = this._getTransactionSchema()
  this.addressSchema = this._getAddressSchema()
  
  this.blockModel = mongoose.model(connectionInfo.collections.blocks, this.blockSchema)
  this.transactionModel = mongoose.model(connectionInfo.collections.transactions, this.transactionSchema)
  this.addressModel = mongoose.model(connectionInfo.collections.addresses, this.addressSchema)

  // Explicit connect to localhost DB
  if (options.connectOnInit) {
    mongoose.connect('mongodb://localhost/ipsum') // TODO: use connectionInfo
  }
}

/**
 * Default options for RPC client.
 * @public
 */
MongoDA.Defaults = {
  connectOnInit: true,
}

MongoDA.prototype = {

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

}

module.exports = MongoDA
