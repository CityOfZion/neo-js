/* eslint handle-callback-err: "off" */
const _ = require('lodash')
const mongoose = require('mongoose')

class MongodbStorage {

  /**
   * @param {Object} options 
   */
  constructor(options = {}) {
    console.log('[mongo] constructor triggered.')

    // Associate class properties
    Object.assign(this, {
      connectOnInit: false,
      collectionNames: {
        blocks: 'b_neo_t_blocks',
        transactions: 'b_neo_t_transactions',
        addresses: 'b_neo_t_addresses'
      }
    }, options)
    this.blockModel = this._getBlockModel()
    this.transactionModel = this._getTransactionModel()
    this.addressModel = this._getAddressModel()
  
    // Bootstrap
    mongoose.Promise = global.Promise // Explicitly supply promise library (http://mongoosejs.com/docs/promises.html)
    if (this.connectOnInit) {
      this._initConnection()
    }
  }

  // Static methods

  // Pubic methods

  // Private methods

  /**
   * @todo Remove magic connection string
   * @todo Verify if mongodb server is available/reachable
   * @private
   */
  _initConnection() {
    const conn = 'mongodb://localhost/demo5'
    mongoose.connect(conn, { useMongoClient: true }, (ignore, connection) => {
      connection.onOpen()
    })
      .then(() => { console.log('mongoose connected.') })
      .catch(console.error)
  }

  /**
   * @private
   */
  _getBlockModel() {
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

    return mongoose.model(this.collectionNames.blocks, schema)
  }

  /**
   * @private
   */
  _getTransactionModel() {
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

    return mongoose.model(this.collectionNames.transactions, schema)
  }

  /**
   * @private
   */
  _getAddressModel() {
    const schema = new mongoose.Schema({
      address: { type: 'String', unique: true, required: true, dropDups: true },
      asset: 'String',
      type: 'String',
      assets: [],
      history: []
    })

    return mongoose.model(this.collectionNames.addresses, schema)
  }

}

module.exports = MongodbStorage
