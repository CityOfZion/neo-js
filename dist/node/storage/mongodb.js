/* eslint handle-callback-err: "off" */
const mongoose = require('mongoose')

class MongodbStorage {
  /**
   * @param {Object} options
   */
  constructor (options = {}) {
    console.log('[mongo] constructor triggered.')

    // Associate class properties
    Object.assign(this, {
      connectOnInit: true,
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
  delintBlock (block) {
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
  hexFix (hex) {
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
   * @param {String} address
   * @return Promise.<Object>
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
   * @todo Implement
   */
  getBalance (address, assets, blockAge) {
    return new Promise((resolve, reject) => {
      // console.log('[mongo] getBalance triggered.')
      reject(new Error('Not implemented'))
    })
  }

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

  saveAddress (hash) {
    return new Promise((resolve, reject) => {
      this.addressModel(hash)
        .save((err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res)
        })
    })
  }

  updateBalance (address, asset, balance, index) {
    return new Promise((resolve, reject) => {
      this.addressModel.update({ address: address, 'assets.asset': asset }, {
        'assets.$.balance': balance,
        'assets.$.index': index
      }).exec((err, res) => {
        if (err) {
          reject(err)
        }

        if (res.n === 0) {
          const result = { asset: asset, balance: balance, index: index, type: 'a' }
          this.addressModel.update({ address: address }, { $push: {assets: result} })
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
  verifyBlocks (start, end) {
    return new Promise((resolve, reject) => {
      let missing = []
      let pointer = start - 1

      console.log('Blockchain Verification: Scanning')

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
   * @returns Promise.<Array> An array containing the indices of the invalid assets.
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

  // Private methods

  /**
   * @todo Remove magic connection string
   * @todo Verify if mongodb server is available/reachable
   * @private
   */
  _initConnection () {
    mongoose.connect(this.connectionString, { useMongoClient: true }, (ignore, connection) => {
      connection.onOpen()
    })
      .then(() => { console.log('mongoose connected.') })
      .catch(console.error)
  }

  /**
   * @private
   */
  _getBlockModel () {
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
   */
  _getTransactionModel () {
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
   */
  _getAddressModel () {
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
