/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
const _ = require('lodash')

/**
 * @class storage
 * @description
 * A storage class for the various storage methods supported by the neo-js.  This class will
 * include high level storage interface methods that will interface with a standard set of methods available
 * on each type of storage.
 * @requires lodash
 */
class storage {

  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    Object.assign(this, {
    storage: {
      model: 'memory'
    },
    blockHeight: 0,
    index: -1,
    dataAccess: {},
    unlinkedBlocks: [],
    assets: [] },
    options)


    //If the model type is mongoDB, load the mongoDB drive
    //and instantiate the storage.
    if (this.model === 'mongoDB'){
      var MongodbStorage = require('./storage/mongodb')
      this.dataAccess = new MongodbStorage(this.storage)

      //Periodically update the list of assets available
      this.updateAssetList()
      setInterval(function(){
        this.updateAssetList, 10000
      })
    }

    //Get the block count available in storage
    this.getBlockCount()

  }

  /**
   * Gets the balance of all assets and tokens for an address.  This method will return the
   * complete balance sheet for an account unless only a subset of assets is requested.  The
   * method also supports an optional blockAge attribute which will act as a caching mechanism to reduce
   * compute load.
   * @param {String} address A contract address to get the balance of.
   * @param {Array} [assets = node.assets] An array of the assets to return balances for.
   * @param {Number} [blockAge = 1]  getBalance uses a caching mechanic to reduce node load.  If
   * An asset's balance for an account has not been updated withing 'blockAge' blocks, it will retrieve an
   * updated value.  Increasing this number and substantial reduce computer load at the expense
   * of balance discretization.
   * @returns Promise.<Array> An array containing the balances of an address.
   */
  getBalance(address, assets = this.assets, blockAge = 1) {
    return new Promise((resolve, reject) => {
      this.dataAccess.getAddress(address)
        .then((res) => {
          // If the address is not found in the database, its new...So add it and retry.
          if (!res) {
            this.dataAccess.saveAddress({ address: address, type: 'c', assets: [] })
              .then((res) => {
                this.getBalance(address)
                  .then((res) => {
                    resolve(res)
                  })
              })
              .catch((err) => {
                reject(err)
              })
          } else {
            // Sort the assets into 'current' and 'needs update'
            var parts = _.partition(res.assets, (asset) => {
              return (this.index - asset.index) >= blockAge
            })

            // If there is an asset list discrepancy, scan for missing assets to update.
            // This mechanic is used to automatically add new asset support as
            // an asset it appears in a transaction.
            if (res.assets.length !== this.assets.length) {
              var included = _.map(res.assets, 'asset')
              this.assets.forEach((asset) => {
                if (included.indexOf(asset.asset) === -1) {
                  parts[0].push({
                    'asset': asset.asset
                  })
                }
              })
            }

            // Update stale balances and resolve
            Promise.all(parts[0].map((asset) =>
              this.getAssetBalance({ address, asset: asset.asset, startBlock: asset.index + 1, balance: asset.balance })
            ))
              .then((res) =>
                resolve(parts[1].concat(res))
              ) // Not handling errors
          }
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /**
   * Gets the balance of an asset belonging to a specific address
   * on the blockchain.  This method will also cache the result to the
   * addresses collection.
   * @param {String} address The address to find the balance of.
   * @param {String} asset The asset to look up.
   * @param {Number} [startBlock = 0] the block start start the calculation from.
   * @param {Number} [balance = 0] the balance at the startBlock.
   * @returns Promise.<object> An object containing the asset balance.
   */
  getAssetBalance(address, asset, startBlock = 0, balance = 0) {
    return new Promise((resolve, reject) => {
      this.getAssetListByAddress(address, asset, startBlock)
        .then((res) => {
          Promise.all(_.map(res, 'txid').map(this.getExpandedTX))
            .then((res) => {
              // Balancing
              res.forEach((r) => {
                r.vout.forEach((output) => {
                  if ((output.address === address) && (output.asset === asset)) {
                    balance += output.value
                  }
                })
                r.vin.forEach((input) => {
                  if ((input.address === address) && (input.asset === asset)) {
                    balance -= input.value
                  }
                })
              })

              // Update the address balances in the collection
              const result = { 'asset': asset, 'balance': balance, 'index': this.index, 'type': 'a' }
              dataAccess.updateBalance(address, asset, balance, this.index)
                .then((res) => {
                  resolve(result)
                }) // Not catching errors
            })
            .catch((err) => {
              reject(err)
            })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /**
   * Calculates and returns the expanded transaction.  This method will also
   * update the expanded transaction in local storage to improve later performance.
   * @param {String} txid The '0x' formatted transaction ID.
   * @returns {Promise.<object>} A JSON formatted representation of a transaction.
   */
  getExpandedTX(txid) {
    return new Promise((resolve, reject) => {
      this.getTX(txid)
        .then((tx) => {
          if (!tx) {
            reject(new Error('Could not find the transaction'))
          }

        // If the tx has already been expanded, return it
        if (tx.vin.some((entry) => _.has(entry, 'asset'))) {
          resolve(tx)
        }

        Promise.all(_.map(tx.vin, 'txid').map(this.getTX))
          .then((res) => {
            tx.vin = _.map(res, (r, i) => r.vout[tx.vin[i].vout])
            this.updateTransaction(tx)
              .then((res) => {
                resolve(tx)
              })
              .catch((err) => { // Despite error, still resolve anyway
                resolve(tx)
              })
          })
          .catch(function (err) {
            console.log('[db] getExpandedTX Promise.all err:', err)
          })
        })
        .catch((err) => {
          console.log('[db] getExpendedTX getTX err:', err)
        })
    })
  }

  /**
   * Returns the JSON formatted transaction from the blockchain.
   * @param {String} txid A '0x' formatted transaction ID.
   * @returns {Promise.<object>} A JSON formatted representation of a transaction.
   */
  getTX(txid) {
    return this.dataAccess.getTX(txid)
  }

  /**
   * Returns the requested block from local storage.
   * @param {Number} index The block index being requested.
   * @returns {Promise.<object>} A JSON formatted block on the blockchain.
   */
  getBlock(index) {
    return this.dataAccess.getBlock(index)
  }

  /**
   * Gets the block height of the blockchain maintained in local storage.
   * This method also caches the height and index in memory for use when identifying
   * blocks that need to be downloaded.
   * @returns {Promise.<number>} The block height
   */
  getBlockCount() {
    return new Promise((resolve, reject) => {
      this.dataAccess.getBlockCount()
        .then((res) => {
          this.index = res - 1
          this.blockHeight = res
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /**
   * Saves a json formated block to storage.  This method will also split out the
   * transactions for storage as well as caching them for later use.
   * @param newBlock {Object} The JSON representation of a block on the blockchain.
   * @returns {Promise.<object>}
   */
  saveBlock(newBlock) {
    return new Promise((resolve, reject) => {
      this.dataAccess.saveBlock(newBlock)
      .then((res) => {
        // Store the raw transaction
        newBlock.tx.forEach((tx) => {
          tx.blockIndex = newBlock.index;
          tx.vout.forEach((d) => {
            if (this.assetsFlat.indexOf(d.asset) == -1) {
              const newAsset = { address: d.asset, asset: d.asset, type: 'a', assets: [] }
              this.assetsFlat.push(d.asset)
              this.assets.push(newAsset)
              this.dataAccess.saveAddress(newAsset)
            }
          })
        })

        Promise.all(_.map(newBlock.tx).map( (tx) => this.dataAccess.saveTransaction(tx)))
          .then((res) => {
            //Because we asynchronously sync the blockchain,
            //we need to keep track of the blocks that have been stored
            //(higher indices could arrive before the lower ones)
            //This code maintains the local blockheight by tracking
            //'linked' and 'unlinked'(but stored) blocks
            if (newBlock.index > this.index) {
              this.unlinkedBlocks.push(newBlock.index);
              var linkIndex = -1;
              while (true){
                linkIndex = this.unlinkedBlocks.indexOf(this.index + 1);
                if (linkIndex != -1){
                  this.unlinkedBlocks.splice(linkIndex,1);
                  this.index++;
                  this.blockHeight++;
                }
                else break;
              }
            }
            resolve(res)
          })
          .catch((err) => reject(err))

      })
      .catch((err) => {
        reject(err)
      })
    })
  }

  /**
   * Verifies local blockchain integrity over a block range.
   * @param {String} [start = 0] The start index of the block range to verify.
   * @param {Number} [end = this.index] The end index of the block range to verify.
   * @returns {Promise.<Array>} An array containing the indices of the missing blocks.
   */
  verify(start = 0, end = this.index) {
    return new Promise((resolve, reject) => {
      this.dataAccess.verify(start, end)
        .then((res) => resolve(res))
    })
  }

  /**
   * Caches the list of assets to improve performance of asset related operations.
   */
  updateAssetList() {
    this.dataAccess.getAssetList()
      .then((res) => {
        this.assets = res
        this.assetsFlat = _.map(res, 'asset')
      })
      // Not catching errors
  }
}

module.exports = storage

