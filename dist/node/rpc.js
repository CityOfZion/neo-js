/* eslint handle-callback-err: "off" */
const axios = require('axios')
const Logger = require('../common/logger')

/**
 * @class Rpc
 */
class Rpc {
  constructor (domain, port, options) {
    // -- Properties
    this.domain = undefined
    this.port = undefined
    this.defaultOptions = {
      logger: new Logger('Rpc')
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.domain = domain
    this.port = port
  }

  /**
   * @access private
   */
  call (payload) {
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
   * @access public
   */
  getBalance (assetId) {
    return this.call({
      method: 'getbalance',
      params: [],
      id: 0
    })
  }

  /**
   * @access public
   */
  getBestBlockHash () {
    return this.call({
      method: 'getbestblockhash',
      params: [],
      id: 0
    })
  }

  /**
   * @access public
   */
  getBlock (index) {
    return this.call({
      method: 'getblock',
      params: [index, 1],
      id: 0
    })
  }

  /**
   * @access public
   */
  getBlockByHash (hash) {
    return this.call({
      method: 'getblock',
      params: [hash, 1],
      id: 0
    })
  }

  /**
   * @access public
   */
  getBlockCount () {
    return this.call({
      method: 'getblockcount',
      params: [],
      id: 0
    }).then((result) => {
      // node.blockHeight = result
      // node.index = result - 1
      return result
    })
  }

  /**
   * @access public
   */
  getBlockHash (index) {
    return this.call({
      method: 'getblockhash',
      params: [index],
      id: 0
    })
  }

  /**
   * @access public
   */
  getBlockSystemFee (height) {
    return this.call({
      method: 'getblocksysfee',
      params: [height],
      id: 0
    }).then((result) => parseInt(result, 10)) // TODO: keep it raw, avoid conversion
  }

  /**
   * @access public
   */
  invoke (payload) {
    // { scriptHash, params }
    return this.call({
      method: 'invoke',
      params: [payload.scriptHash, payload.params],
      id: 0
    }).catch((_err) => Promise.reject(new Error('Unable to contact the requested node.')))
  }

  /**
   * @access public
   */
  invokeFunction (payload) {
    // { scriptHash, operation, params }
    return this.call({
      method: 'invokefunction',
      params: [payload.scriptHash, payload.operation, payload.params],
      id: 0
    }).catch((_err) => Promise.reject(new Error('Unable to contact the requested node.')))
  }

  /**
   * @access public
   */
  invokeScript (script) {
    return this.call({
      method: 'invokescript',
      params: [script],
      id: 0
    }).catch((_err) => Promise.reject(new Error('Unable to contact the requested node.')))
  }

  /**
   * @access public
   */
  getRawMemPool () {
    return this.call({
      method: 'getrawmempool',
      params: [],
      id: 0
    }).catch((_err) => Promise.reject(new Error('Unable to contact the requested node.')))
  }

  /**
   * @access public
   */
  getRawTransaction (txid) {
    // TODO: rename txid
    return this.call({
      method: 'getrawtransaction',
      params: [txid, 1],
      id: 0
    })
  }

  /**
   * @access public
   */
  getTXOut (payload) {
    // TODO: rename txid
    // { txid, index }
    return this.call({
      method: 'gettxout',
      params: [payload.txid, payload.index],
      id: 0
    })
  }

  /**
   * @access public
   */
  sendRawTransaction (hex) {
    return this.call({
      method: 'sendrawtransaction',
      params: [hex],
      id: 0
    })
  }

  /**
   * @access public
   */
  sendToAddress (payload) {
    // { assetId, address, value }
    return this.call({
      method: 'sendtoaddress',
      params: [payload.assetId, payload.address, payload.value],
      id: 0
    })
  }

  /**
   * @access public
   */
  submitBlock (hex) {
    return this.call({
      method: 'submitblock',
      params: [hex],
      id: 0
    })
  }

  /**
   * @access public
   */
  getAccountState (address) {
    return this.call({
      method: 'getaccountstate',
      params: [address],
      id: 0
    })
  }

  /**
   * @access public
   */
  getAssetState (assetId) {
    return this.call({
      method: 'getassetstate',
      params: [assetId],
      id: 0
    })
  }

  /**
   * @access public
   */
  getContractState (hash) {
    return this.call({
      method: 'getcontractstate',
      params: [hash],
      id: 0
    })
  }

  /**
   * @access public
   */
  validateAddress (address) {
    return this.call({
      method: 'validateaddress',
      params: [address],
      id: 0
    })
  }

  /**
   * @access public
   */
  getPeers () {
    return this.call({
      method: 'getpeers',
      params: [],
      id: 0
    })
  }

  getConnectionCount () {
    return this.call({
      method: 'getconnectioncount',
      params: [],
      id: 0
    })
  }
}

module.exports = Rpc
