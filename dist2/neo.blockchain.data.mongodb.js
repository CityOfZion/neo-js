const mongoose = require('mongoose')
const _ = require('lodash')
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
  this.blockModel = this._getBlockModel()
  this.transactionModel = this._getTransactionModel()
  this.addressModel = this._getAddressModel()

  // Bootstrap

}

/**
 * Default options for RPC client.
 * @public
 */
MongoDA.Defaults = {
}

MongoDA.prototype = {


  saveBlock: function (newBlock) {
    return new Promise((resolve, reject) => {
      // Store the raw block
      newBlock = this.delintBlock(newBlock)
      this.blockModel(newBlock).save((err) => {
        if (err) {
          return reject(err)
        }

        // Store the raw transaction
        newBlock.tx.forEach((tx) => {
          tx.blockIndex = newBlock.index
          tx.vout.forEach((d) => {
            if (node.assetsFlat.indexOf(d.asset) === -1) {
              this.addressModel({ address: d.asset, asset: d.asset, type: 'a', assets: [] }).save()
            }
          })

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
        if (newBlock.index > node.index) {
          node.unlinkedBlocks.push(newBlock.index)
          let linkIndex = -1
          while (true) {
            linkIndex = node.unlinkedBlocks.indexOf(node.index + 1)
            if (linkIndex !== -1) {
              node.unlinkedBlocks.splice(linkIndex, 1)
              node.index++
              node.blockHeight++
            } else {
              break
            }
          }
        }
        resolve()
      })
    })
  },

  delintBlock: function (block) {
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

  _getBlockModel: function () {
    const schema = new mongoose.Schema({
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
    return mongoose.model(this.connectionInfo.collections.blocks, schema)
  },

  _getTransactionModel: function () {
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
      scripts: []
    })
    return mongoose.model(this.connectionInfo.collections.transactions, schema)
  },

  _getAddressModel: function () {
    const schema = new mongoose.Schema({
      address: { type: 'String', unique: true, required: true, dropDups: true },
      asset: 'String',
      type: 'String',
      assets: [],
      history: []
    })
    return mongoose.model(this.connectionInfo.collections.addresses, schema)
  },

}

module.exports = MongoDA
