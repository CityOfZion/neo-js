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
      connectionString: 'mongodb://localhost/neo',
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

  /**
   * @todo Migrate to a helper class
   * @static
   * @param {Object} block 
   * @return {Object}
   */
  static delintBlock(block) {
    block.hash = this.hexFix(block.hash)
    block.previousblockhash = this.hexFix(block.previousblockhash)
    block.merkleroot = this.hexFix(block.merkleroot)
    block.tx.forEach((tx) => {
      tx.txid = this.hexFix(tx.txid)
      tx.sys_fee = parseFloat(tx.sys_fee)
      tx.net_fee = parseFloat(tx.net_fee)

      tx.vout.forEach((vout) => {
        vout.asset = this.hexFix(vout.asset)
        vout.value = parseFloat(vout.value)
      })
    })
    return block
  }

  /**
   * @todo Migrate to a helper class
   * @static
   * @param {string} block 
   * @return {string}
   */
  static hexFix(hex) {
    if (hex.length === 64) {
      hex = '0x' + hex
    }
    return hex
  }

  // Pubic methods

  /**
   * @todo Use helper function to normalise txid
   * @param {string} txid 
   */
  getTX(txid) {
    new Promise((resolve, reject) => {
      if (txid.length > 64) {
        txid = txid.slice(2)
      }

      module.transactions.findOne({ $or: [{'txid': txid}, {'txid': '0x' + txid}] })
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('transaction not found'))
          }
          resolve(res)
        })
    })
  }

  /**
   * @todo Implement
   */
  getBalance(address, assets, blockAge) {
    return new Promise((resolve, reject) => {
      console.log('[mongo] getBalance triggered.')
      resolve(true)
    })
  }

  getBlock(index) {
    return new Promise((resolve, reject) => {
      console.log('[mongo] getBlock triggered. index:', index)
      
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
  }

  getBlockList() {
    return new Promise((resolve, reject) => {
      this.blockModel.find({}, 'index')
        .sort('index')
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('Block not found.'))
          }
          resolve(res)
        })
    })
  }

  getBlockCount() {
    return new Promise((resolve, reject) => {
      this.blockModel.findOne({}, 'index')
        .sort('-index')
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

  getAssetList() {
    return new Promise((resolve, reject) => {
      this.addressModel.find({ type: 'a' }, 'asset')
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('assets not found'))
          }
          resolve(res)
        })
    })
  }

  getAssetListByAddress(address, asset, startBlock) {
    return new Promise((resolve, reject) => {
      this.transactionModel.find({
        'vout.address': address,
        $or: [
          {'type': 'ContractTransaction'},
          {'type': 'InvocationTransaction'},
          {'type': 'ClaimTransaction'}
        ],
        'vout.asset': asset,
        'blockIndex': { '$gte': startBlock }
      }, 'txid')
        .sort('blockIndex')
        .exec((err, res) => {
          if (err) {
            reject(err)
          }
          if (!res) {
            reject(new Error('assets not found'))
          }
          resolve(res)
        })
    })
  }

  saveAsset(asset) {
    return new Promise((resolve, reject) => {
      this.addressModel(asset).save((err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  saveBlock(block) {
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

  saveTransaction(tx) {
    return new Promise((resolve, reject) => {
      this.transactionModel(tx).save((err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  updateTransaction(tx) {
    return new Promise((resolve, reject) => {
      this.transactionModel.update({'txid': tx.txid}, tx, (err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  getAddress(addressHash) {
    return new Promise((resolve, reject) => {
      this.addressModel.findOne({ 'address': addressHash })
      .exec((err, res) => {
        if (err) {
          reject(err)
        }
        resolve(res)
      })
    })
  }

  saveAddress(addressHash, type) {
    return new Promise((resolve, reject) => {
      this.addressModel({ 'address': addressHash, 'type': type, 'assets': [] })
        .save((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  updateBalance(address, asset, balance, index) {
    return new Promise((resolve, reject) => {
      this.addressModel.update({ 'address': address, 'assets.asset': asset }, {
        'assets.$.balance': balance,
        'assets.$.index': index
      }).exec((err, res) => {
        if (err) {
          reject(err)
        }

        if (res.n === 0) {
          const result = { 'asset': asset, 'balance': balance, 'index': index, 'type': 'a' }
          this.addressModel.update({ 'address': address }, { '$push': {'assets': result} })
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
   * @param {String} [start = 0] The start index of the block range to verify.
   * @param {Number} [end] The end index of the block range to verify.
   * @returns Promise.<Array> An array containing the indices of the missing blocks.
   */
  verify(start, end) {
    return new Promise((resolve, reject) => {
      var missing = []
      var pointer = start - 1

      console.log('Blockchain Verification: Scanning')

      var stream = this.blockModel
        .find({index: {'$gte': start, '$lte': end}}, 'index').sort('index')
        .cursor();

      stream.on('data', (d) => {
        console.log(d)
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

  // Private methods

  /**
   * @todo Remove magic connection string
   * @todo Verify if mongodb server is available/reachable
   * @private
   */
  _initConnection() {
    mongoose.connect(this.connectionString, { useMongoClient: true }, (ignore, connection) => {
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
