/* eslint handle-callback-err: "off" */
const axios = require('axios')
const Neon = require('@cityofzion/neon-js')
const Query = Neon.rpc.Query
const Logger = require('../common/logger')

/**
 * @class Rpc
 * @param {string} domain
 * @param {string} port
 * @param {Object} options
 * @param {Object} options.loggerOptions
 */
class Rpc {
  constructor (domain, port, options) {
    // -- Properties
    /** @type {string} */
    this.domain = undefined
    /** @type {string} */
    this.port = undefined
    /** @type {Object} */
    this.neonRpc = undefined
    /** @type {Object} */
    this.logger = undefined
    /** @type {Object} */
    this.defaultOptions = {
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.domain = domain
    this.port = port
    this.logger = new Logger('Rpc', this.loggerOptions)
    this.initNeonRpc()
  }

  /**
   * @private
   * @returns {void}
   */
  initNeonRpc () {
    this.neonRpc = Neon.rpc.default.create.rpcClient(this.getRpcUrl())
  }

  /**
   * @private
   * @returns {string}
   */
  getRpcUrl () {
    return `${this.domain}:${this.port}`
  }

  /**
   * @private
   * @deprecated as all calls are to be done through neon-js instead.
   * @param {Object} payload
   * @param {string} payload.method
   * @param {Array} payload.params
   * @param {string} payload.id
   * @returns {Promise.<Object>}
   */
  call (payload) {
    this.logger.debug('call triggered. payload:', payload)
    // const t0 = Date.now()
    // node.pendingRequests += 1
    return axios({
      method: 'post',
      url: `${this.domain}:${this.port}`,
      data: {
        jsonrpc: '2.0',
        method: payload.method,
        params: payload.params,
        id: payload.id
      },
      timeout: 10000
    }).then((response) => {
      // node.pendingRequests -= 1
      // node.age = Date.now()
      if (response.data.error) {
        return Promise.reject(response.data.error)
      }
      // node.latency = node.age - t0
      // node.active = true
      return response.data.result
    }).catch((err) => {
      // node.pendingRequests -= 1
      // node.age = Date.now()
      // node.active = false
      return Promise.reject(err)
    })
  }

  /**
   * Get balances of NEO and GAS for an address.
   * @public
   * @param {string} assetId
   * @returns {Promise.<object>}
   */
  getBalance (assetId) {
    this.logger.debug('getBalance triggered. assetId:', assetId)
    return this.neonRpc.getBalance(assetId)
  }

  /**
   * Get the latest block hash.
   * @public
   * @returns {Promise.<object>}
   */
  getBestBlockHash () {
    this.logger.debug('getBestBlockHash triggered.')
    return this.neonRpc.getBestBlockHash()
  }

  /**
   * Gets the block at a given height.
   * @public
   * @param {number} index - The index of the block being requested.
   * @param {number} verbose
   * @returns {Promise.<object>} A promise returning information of the block
   */
  getBlock (index, verbose = 1) {
    this.logger.debug('getBlock triggered. index:', index, 'verbose:', verbose)
    return this.neonRpc.getBlock(index, verbose)
  }

  /**
   * Gets the block at a given hash.
   * @public
   * @param {string} hash - The hash of the block being requested.
   * @param {number} verbose
   * @returns {Promise.<object>} A promise returning information of the block
   */
  getBlockByHash (hash, verbose = 1) {
    this.logger.debug('getBlockByHash triggered. hash:', hash, 'verbose:', verbose)
    return this.neonRpc.getBlock(hash, verbose)
  }

  /**
   * Get the current block height.
   * @public
   * @returns {Promise.<number>} A promise returning the block count.
   */
  getBlockCount () {
    this.logger.debug('getBlockCount triggered.')
    return this.neonRpc.getBlockCount()
  }

  /**
   * Gets the block hash at a given index.
   * @public
   * @param {number} index - The index of the block hash being requested.
   * @returns {Promise.<string>} A promise returning the hash of the block
   */
  getBlockHash (index) {
    this.logger.debug('getBlockHash triggered. index:', index)
    return this.call({
      method: 'getblockhash',
      params: [index],
      id: 0
    })
  }

  /**
   * Get system fee.
   * @public
   * @param {number} index - The index of the block hash being requested.
   * @returns {Promise.<string>} The system fee.
   */
  getBlockSystemFee (index) {
    this.logger.debug('getBlockSystemFee triggered. index:', index)
    return this.neonRpc.getBlockSysFee(index)
  }

  /**
   * Gets the number of peers this node is connected to.
   * @public
   * @returns {Promise.<number>}
   */
  getConnectionCount () {
    this.logger.debug('getConnectionCount triggered.')
    return this.neonRpc.getConnectionCount()
  }

  /**
   * Get user agent string of connected neo blockchain.
   * @public
   * @returns {Promise.<object>}
   */
  getVersion () {
    this.logger.debug('getVersion triggered.')
    // NOTE: rpc.getVersion() will try to parse the user agent to version value, while Query's version will retain it's raw form
    return new Promise((resolve, reject) => {
      Query.getVersion()
        .execute(this.getRpcUrl())
        .then((res) => {
          resolve(res.result)
        })
        .catch((err) => reject(err))
    })
  }

  /**
   * Calls a smart contract with the given parameters. This method is a local invoke, results are not reflected on the blockchain.
   * @public
   * @param {object} payload
   * @param {object} payload.scriptHash - The hash of the script to invoke.
   * @param {Array} payload.params - The params used to invoke the contract.
   * @returns {Promise.<object>} The invoke response.
   */
  invoke (payload) {
    this.logger.debug('invoke triggered. payload:', payload)
    return this.neonRpc.invoke(payload.scriptHash, payload.params)
  }

  /**
   * Submits a contract method call with parameters for the node to run. This method is a local invoke, results are not reflected on the blockchain.
   * @public
   * @param {object} payload
   * @param {object} payload.scriptHash - The hash of the script to invoke.
   * @param {object} payload.operation - Defines the operation to invoke on the contract.
   * @param {Array} payload.params - The params used to invoke the contract.
   * @returns {Promise.<object>} The invoke response.
   */
  invokeFunction (payload) {
    this.logger.debug('invokeFunction triggered. payload:', payload)
    return this.neonRpc.invokeFunction(payload.scriptHash, payload.operation, payload.params)
  }

  /**
   * Submits a script for the node to run. This method is a local invoke, results are not reflected on the blockchain.
   * @public
   * @param script - raw script to invoke.
   * @returns {Promise.<object>} The invoke response.
   */
  invokeScript (script) {
    this.logger.debug('invokeScript triggered. script:', script)
    return this.neonRpc.invokeScript(script)
  }

  /**
   * Gets a list of all transaction hashes waiting to be processed.
   * @public
   * @returns {Promise.<string[]>}
   */
  getRawMemPool () {
    this.logger.debug('getRawMemPool triggered.')
    return this.neonRpc.getRawMemPool()
  }

  /**
   * Gets a transaction based on its hash.
   * @public
   * @param {string} txid
   * @param {number} verbose
   * @param {Promise.<string|object>}
   * @returns {Promise.<object>}
   */
  getRawTransaction (txid, verbose = 1) {
    this.logger.debug('getRawTransaction triggered. txid:', txid, 'verbose:', verbose)
    return this.neonRpc.getRawTransaction(txid, verbose)
  }

  /**
   * Polls the node for the raw transaction response associated with an input txid.
   * @public
   * @param {Object} payload
   * @param {string} payload.txid - The requested transaction ID.
   * @param {number} payload.index
   * @returns {Promise.<object>} An object containing the transaction response.
   */
  getTXOut (payload) {
    this.logger.debug('getTXOut triggered. payload:', payload)
    return this.neonRpc.getTxOut(payload.txid, payload.index)
  }

  /**
   * Sends a serialized transaction to the network.
   * @public
   * @param {object|string} transaction
   * @return {Promise.<boolean>}
   */
  sendRawTransaction (transaction) {
    this.logger.debug('sendRawTransaction triggered. transaction:', transaction)
    return this.neonRpc.sendRawTransaction(transaction)
  }

  /**
   * @public
   * @param {Object} payload
   * @param {string} payload.assetId
   * @param {string} payload.address
   * @param {number} payload.value
   * @returns {Promise.<Object>}
   */
  sendToAddress (payload) {
    this.logger.debug('sendToAddress triggered. payload:', payload)
    return this.call({
      method: 'sendtoaddress',
      params: [payload.assetId, payload.address, payload.value],
      id: 0
    })
  }

  /**
   * Submits a serialized block to the network.
   * @public
   * @param {string} block
   * @returns {Promise.<object>}
   */
  submitBlock (block) {
    this.logger.debug('submitBlock triggered. block:', block)
    return this.neonRpc.submitBlock(block)
  }

  /**
   * Gets the state of an account given an address.
   * @public
   * @param {string} address
   * @returns {Promise.<object>}
   */
  getAccountState (address) {
    this.logger.debug('getAccountState triggered. address:', address)
    return this.neonRpc.getAccountState(address)
  }

  /**
   * @public
   * @param {string} assetId
   * @returns {Promise.<Object>}
   */
  getAssetState (assetId) {
    this.logger.debug('getAssetState triggered. assetId:', assetId)
    return this.neonRpc.getAssetState(assetId)
  }

  /**
   * Gets the state of the contract at the given scriptHash.
   * @public
   * @param {string} scriptHash
   * @returns {Promise.<object>}
   */
  getContractState (scriptHash) {
    this.logger.debug('getContractState triggered. scriptHash:', scriptHash)
    return this.neonRpc.getContractState(scriptHash)
  }

  /**
   * Checks if the provided address is a valid NEO address.
   * @public
   * @param {string} address
   * @returns {Promise.<object>}
   */
  validateAddress (address) {
    this.logger.debug('validateAddress triggered. address:', address)
    // NOTE: Neon's rpc.validateAddress() will try to obtain value of result property, while Query's version will retain it's raw form
    return new Promise((resolve, reject) => {
      Query.validateAddress(address)
        .execute(this.getRpcUrl())
        .then((res) => {
          resolve(res.result)
        })
        .catch((err) => reject(err))
    })
  }

  /**
   * Gets a list of all peers that this node has discovered.
   * @public
   * @returns {Promise.<object>}
   */
  getPeers () {
    this.logger.debug('getPeers triggered.')
    return this.neonRpc.getPeers()
  }
}

module.exports = Rpc
