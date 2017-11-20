/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
var _ = require('lodash')
var MongodbStorage = require('./storage/mongodb')

module.exports = function (network) {
  var module = {}

  const EXPLICIT_DB_CONNECT = true
  let collectionNames = {
    blocks: 'b_neo_t_blocks',
    transactions: 'b_neo_t_transactions',
    addresses: 'b_neo_t_addresses'
  }
  if (network === 'mainnet') {
    collectionNames = {
      blocks: 'b_neo_m_blocks',
      transactions: 'b_neo_m_transactions',
      addresses: 'b_neo_m_addresses'
    }
  }
  const dataAccess = new MongodbStorage({ connectOnInit: true, collectionNames })

  /**
   * @class node
   * @variation 2
   * @description
   * A class defining a local node on the neo blockchain.
   */
  module.node = function node () {
    this.domain = 'localhost'
    this.active = true
    this.latency = 0
    this.blockHeight = 0
    this.index = -1
    this.connections = 0
    this.pendingRequests = 0
    this.unlinkedBlocks = []
    this.assets = []
    var node = this

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
    this.getBalance = function (address, assets = node.assets, blockAge = 1) {
      return new Promise((resolve, reject) => {
        dataAccess.getAddress(address)
          .then((res) => {
            // If the address is not found in the database, its new...So add it and retry.
            if (!res) {
              dataAccess.saveAddress({ address: address, type: 'c', assets: [] })
                .then((res) => {
                  node.getBalance(address)
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
                return (node.index - asset.index) >= blockAge
              })
              
              // If there is an asset list discrepancy, scan for missing assets to update.
              // This mechanic is used to automatically add new asset support as
              // an asset it appears in a transaction.
              if (res.assets.length !== node.assets.length) {
                var included = _.map(res.assets, 'asset')
                node.assets.forEach((asset) => {
                  if (included.indexOf(asset.asset) === -1) {
                    parts[0].push({
                      'asset': asset.asset
                    })
                  }
                })
              }

              // Update stale balances and resolve
              Promise.all(parts[0].map((asset) =>
                node.getAssetBalance({ address, asset: asset.asset, startBlock: asset.index + 1, balance: asset.balance })
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
    this.getAssetBalance = function (address, asset, startBlock = 0, balance = 0) {
      return new Promise((resolve, reject) => {
        dataAccess.getAssetListByAddress(address, asset, startBlock)
          .then((res) => {
            Promise.all(_.map(res, 'txid').map(node.getExpandedTX))
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
                const result = { 'asset': asset, 'balance': balance, 'index': node.index, 'type': 'a' }
                dataAccess.updateBalance(address, asset, balance, node.index)
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

    this.getExpandedTX = function (txid) {
      return new Promise((resolve, reject) => {
        dataAccess.getTX(txid)
          .then((tx) => {
            if (!tx) {
              reject(new Error('Could not find the transaction'))
            }

          // If the tx has already been expanded, return it
          if (tx.vin.some((entry) => _.has(entry, 'asset'))) {
            resolve(tx)
          }

          Promise.all(_.map(tx.vin, 'txid').map(node.getTX))
            .then((res) => {
              tx.vin = _.map(res, (r, i) => r.vout[tx.vin[i].vout])
              dataAccess.updateTransaction(tx)
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

    this.getTX = function (txid) {
      return dataAccess.getTX(txid)
    }

    this.getBestBlockHash = function () {}

    this.getBlock = function (index) {
      return dataAccess.getBlock(index)
    }

    this.getBlockCount = function () {
      return new Promise((resolve, reject) => {
        dataAccess.getBlockCount()
          .then((res) => {
            node.index = res - 1
            node.blockHeight = res
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }

    this.getBlockHash = function (index) {}

    this.getConnectionCount = function () {}

    this.getRawMemPool = function () {}

    this.getTXOut = function (txid) {}

    this.sendRawTransaction = function () {}

    this.sendToAddress = function (assetId, address, value) {}

    this.submitBlock = function () {}

    this.saveBlock = function (newBlock) {
      return new Promise((resolve, reject) => {
        dataAccess.saveBlock(newBlock)
        .then((res) => {
          // Store the raw transaction
          newBlock.tx.forEach((tx) => {
            tx.blockIndex = newBlock.index;
            tx.vout.forEach((d) => {
              if (node.assetsFlat.indexOf(d.asset) == -1) {
                const newAsset = { address: d.asset, asset: d.asset, type: 'a', assets: [] }
                node.assetsFlat.push(d.asset)
                node.assets.push(newAsset)
                dataAccess.saveAddress(newAsset)
              }
            })
            dataAccess.saveTransaction(tx)
              .catch((err) => {
                reject(err)
                console.log('[db] saveBlock, saveTransaction err:', err)
              })
          })

          Promise.all(_.map(newBlock.tx).map(dataAccess.saveTransaction))
            .then((res) => {
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
     * @param {Number} [end = node.index] The end index of the block range to verify.
     * @returns Promise.<Array> An array containing the indices of the missing blocks.
     */
    this.verify = (start = 0, end = node.index) => {
      return new Promise((resolve, reject) => {
        dataAccess.verify(start, end)
          .then((res) => resolve(res))
      })
    }

    this.getBlockCount()

    var updateAssetList = function () {
      dataAccess.getAssetList()
        .then((res) => {
          node.assets = res
          node.assetsFlat = _.map(res, 'asset')
        })
        // Not catching errors
    }
    updateAssetList()
    setInterval(updateAssetList, 10000)
  }

  return module
}
