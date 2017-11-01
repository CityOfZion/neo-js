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

  // Bootstrap
  mongoose.Promise = global.Promise // Explicitly proide own promise library (http://mongoosejs.com/docs/promises.html)

  // Explicit connect to localhost DB
  if (options.connectOnInit) {
    mongoose.connect('mongodb://localhost/ipsum') // TODO: use connectionInfo
  }
}

/**
 * Default options.
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

  getBestBlockHash: function () {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({})
        .sort({ index: -1 })
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

  getBlockByHash: function (hash) {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({ hash })
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

  saveBlock: function (newBlock) {
    return new Promise((resolve, reject) => {
      // Store the raw block
      newBlock = this._delintBlock(newBlock)
      this.blockModel(newBlock).save((err) => {
        if (err) {
          reject(err)
        }

        // Store the raw transaction
        newBlock.tx.forEach((tx) => {
          tx.blockIndex = newBlock.index
          // tx.vout.forEach((d) => {
          //   if (node.assetsFlat.indexOf(d.asset) === -1) {
          //     module.addresses({ address: d.asset, asset: d.asset, type: 'a', assets: [] }).save()
          //   }
          // })

          this.transactionModel(tx).save((err) => {
            if (err) {
              console.log(err)
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
        // if (newBlock.index > node.index) {
        //   node.unlinkedBlocks.push(newBlock.index)
        //   let linkIndex = -1
        //   while (true) {
        //     linkIndex = node.unlinkedBlocks.indexOf(node.index + 1)
        //     if (linkIndex !== -1) {
        //       node.unlinkedBlocks.splice(linkIndex, 1)
        //       node.index++
        //       node.blockHeight++
        //     } else {
        //       break
        //     }
        //   }
        // }
        resolve()
      })
    })
  }

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

}

module.exports = MongoDA
