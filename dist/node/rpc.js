/* eslint handle-callback-err: "off" */
const axios = require('axios')
const Logger = require('../common/logger')

/**
 * @class Rpc
 * @param {string} domain
 * @param {string} port
 * @param {Object} options
 * @param {Object} options.logger
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
    this.defaultOptions = {
      logger: undefined,
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.domain = domain
    this.port = port
    this.initLogger()
  }

  /**
   * @private
   * @returns {void}
   */
  initLogger () {
    this.logger = new Logger('Rpc', this.loggerOptions)
  }

  /**
   * @private
   * @param {Object} payload
   * @param {string} payload.method
   * @param {Array} payload.params
   * @param {string} payload.id
   * @returns {Promise.<Object>}
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
   * Gets the NEO and GAS balance of an address.
   * @public
   * @param {string} assetId - The address to get the balance of.
   * @returns {Promise.<Object>} A promise containing the address balances.
   */
  getBalance (assetId) {
    return this.call({
      method: 'getbalance',
      params: [],
      id: 0
    })
  }

  /**
   * Gets the best block hash on the node
   * @public
   * @example
   * node.rpc.getBestBlockHash()
   * return 0x051b5bf812db0536e488670b26abf3a45a5e1a400595031cf9a57416bea0b973
   * @returns {Promise.<Object>}
   */
  getBestBlockHash () {
    return this.call({
      method: 'getbestblockhash',
      params: [],
      id: 0
    })
  }

  /**
   * Invokes the getblock rpc request to return a block.  This method
   * accepts and optional node to request the block from.  If a node is not selected,
   * the fastest node will be used with failover in an attempt to guarantee a response.
   *
   * @public
   * @example
   * node.rpc.getBlock(100000)
   *  return {
   *    "jsonrpc": "2.0",
   *    "id": 0,
   *    "result": {
   *      "hash": "0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122",
   *      "size": 686,
   *      "version": 0,
   *      "previousblockhash": "0xdea902d1ddb8bbd3000d1cbc96a5a69b2170a5f993cce23eb5bb955920f43454",
   *      "merkleroot": "0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042",
   *      "time": 1496454840,
   *      "index": 100000,
   *      "nonce": "40fcadce5e6f395a",
   *      "nextconsensus": "AdyQbbn6ENjqWDa5JNYMwN3ikNcA4JeZdk",
   *      "script": {
   *        "invocation": "400190144d56bf951badc561395712a86e305b373592ff7ee559d6db0934adb6e116247a8ccc5d42858e9201beedbe904adabe7fd250bc9d1814e8d3ed1b48293d408b78d73679bc45c085ec9c0423ba79889710101918170cd48ebea16e7befd555aa23ee0c256fcd3228f614ba5b607e077dffaf5614e9f7ce78a3c5d60a92baba40170495d99bc2665277d5512eddde13cea37bf74b5c265a3e741783c0837e7f5909a6383780cb5ff03af04e4085ede121a7f94d1c0ddc371cae5e8b968f18f8d440d36e5b7dcfe49894f12cf50476098fb5423ffd36154cee652cdf1cee50fda9240ca6a6cf3cf824457afa45f07661a8c35b6bc0e7f334a903c99b5683b5bf53ce40cc0ad387dedff608e4c032b598e0a54668d9ec2c46e207ea294c76844a3ff951dca324148eca3dc6938402fb2fe5006fbc551f4f1a09d6366c126f787a06c063",
   *        "verification": "55210209e7fd41dfb5c2f8dc72eb30358ac100ea8c72da18847befe06eade68cebfcb9210327da12b5c40200e9f65569476bbff2218da4f32548ff43b6387ec1416a231ee821034ff5ceeac41acf22cd5ed2da17a6df4dd8358fcb2bfb1a43208ad0feaab2746b21026ce35b29147ad09e4afe4ec4a7319095f08198fa8babbe3c56e970b143528d2221038dddc06ce687677a53d54f096d2591ba2302068cf123c1f2d75c2dddc542557921039dafd8571a641058ccc832c5e2111ea39b09c0bde36050914384f7a48bce9bf92102d02b1873a0863cd042cc717da31cea0d7cf9db32b74d4c72c01b0011503e2e2257ae"
   *      },
   *      "tx": [{
   *        "txid": "0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042",
   *        "size": 10,
   *        "type": "MinerTransaction",
   *        "version": 0,
   *        "attributes": [],
   *        "vin": [],
   *        "vout": [],
   *        "sys_fee": "0",
   *        "net_fee": "0",
   *        "scripts": [],
   *        "nonce": 1584347482
   *      }],
   *      "confirmations": 510871,
   *      "nextblockhash": "0xc8880a1a91915b3d7d48265d1bafd8fe120e1571c02924ee4ca005d03e348ecb"
   *    }
   *  }
   * @param {number} index - The index of the block being requested.
   * @returns {Promise.<string>} A promise returning the hex contents of the block
   */
  getBlock (index) {
    return this.call({
      method: 'getblock',
      params: [index, 1],
      id: 0
    })
  }

  /**
   * Invokes the getblock rpc request to return a block.  This method
   * accepts and optional node to request the block from.  If a node is not selected,
   * the fastest node will be used with failover in an attempt to guarantee a response.
   *
   * @public
   * @example
   * node.rpc.getBlockByHash('0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122')
   *  return {
   *    "jsonrpc": "2.0",
   *    "id": 0,
   *    "result": {
   *      "hash": "0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122",
   *      "size": 686,
   *      "version": 0,
   *      "previousblockhash": "0xdea902d1ddb8bbd3000d1cbc96a5a69b2170a5f993cce23eb5bb955920f43454",
   *      "merkleroot": "0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042",
   *      "time": 1496454840,
   *      "index": 100000,
   *      "nonce": "40fcadce5e6f395a",
   *      "nextconsensus": "AdyQbbn6ENjqWDa5JNYMwN3ikNcA4JeZdk",
   *      "script": {
   *        "invocation": "400190144d56bf951badc561395712a86e305b373592ff7ee559d6db0934adb6e116247a8ccc5d42858e9201beedbe904adabe7fd250bc9d1814e8d3ed1b48293d408b78d73679bc45c085ec9c0423ba79889710101918170cd48ebea16e7befd555aa23ee0c256fcd3228f614ba5b607e077dffaf5614e9f7ce78a3c5d60a92baba40170495d99bc2665277d5512eddde13cea37bf74b5c265a3e741783c0837e7f5909a6383780cb5ff03af04e4085ede121a7f94d1c0ddc371cae5e8b968f18f8d440d36e5b7dcfe49894f12cf50476098fb5423ffd36154cee652cdf1cee50fda9240ca6a6cf3cf824457afa45f07661a8c35b6bc0e7f334a903c99b5683b5bf53ce40cc0ad387dedff608e4c032b598e0a54668d9ec2c46e207ea294c76844a3ff951dca324148eca3dc6938402fb2fe5006fbc551f4f1a09d6366c126f787a06c063",
   *        "verification": "55210209e7fd41dfb5c2f8dc72eb30358ac100ea8c72da18847befe06eade68cebfcb9210327da12b5c40200e9f65569476bbff2218da4f32548ff43b6387ec1416a231ee821034ff5ceeac41acf22cd5ed2da17a6df4dd8358fcb2bfb1a43208ad0feaab2746b21026ce35b29147ad09e4afe4ec4a7319095f08198fa8babbe3c56e970b143528d2221038dddc06ce687677a53d54f096d2591ba2302068cf123c1f2d75c2dddc542557921039dafd8571a641058ccc832c5e2111ea39b09c0bde36050914384f7a48bce9bf92102d02b1873a0863cd042cc717da31cea0d7cf9db32b74d4c72c01b0011503e2e2257ae"
   *      },
   *      "tx": [{
   *        "txid": "0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042",
   *        "size": 10,
   *        "type": "MinerTransaction",
   *        "version": 0,
   *        "attributes": [],
   *        "vin": [],
   *        "vout": [],
   *        "sys_fee": "0",
   *        "net_fee": "0",
   *        "scripts": [],
   *        "nonce": 1584347482
   *      }],
   *      "confirmations": 510871,
   *      "nextblockhash": "0xc8880a1a91915b3d7d48265d1bafd8fe120e1571c02924ee4ca005d03e348ecb"
   *    }
   *  }
   * @param {string} hash - The hash of the block being requested.
   * @returns {Promise.<Object>} A promise returning information of the block
   */
  getBlockByHash (hash) {
    return this.call({
      method: 'getblock',
      params: [hash, 1],
      id: 0
    })
  }

  /**
   * Invokes the getblockcount rpc request to return the block height.  This
   * method will request the block height from the fastest active node with failover if a
   * node is not provided.  This method will update the blockHeight attribute
   * on the node it is run on.
   *
   * @public
   * @example
   * node.rpc.getBlockCount()
   * return 1000000
   * @returns {Promise.<number>} A promise returning the block count.
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
   * Invokes the getblockhash rpc request to return a block's hash.  This method
   * accepts and optional node to request the block from.  If a node is not selected,
   * the fastest node will be used with failover in an attempt to guarantee a response.
   *
   * @public
   * @param {number} index - The index of the block hash being requested.
   * @example
   * node.rpc.getBlockHash(100000)
   * return '0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122'
   * @returns {Promise.<string>} A promise returning the hash of the block
   */
  getBlockHash (index) {
    return this.call({
      method: 'getblockhash',
      params: [index],
      id: 0
    })
  }

  /**
   * Invokes the getblocksysfee rpc request to return system fee.
   *
   * @public
   * @param {number} height - The index of the block hash being requested.
   * @example
   * node.rpc.getBlockSystemFee(100000)
   * return 905
   * @returns {Promise.<number>} The system fee.
   */
  getBlockSystemFee (height) {
    return this.call({
      method: 'getblocksysfee',
      params: [height],
      id: 0
    }).then((result) => parseInt(result, 10)) // TODO: keep it raw, avoid conversion
  }

  /**
   * Invokes the getconnectioncount rpc request to return the number of connections to
   * the selected node.
   *
   * @public
   * @example
   * node.rpc.getConnectionCount()
   * return 10
   * @returns {Promise.<number>} A promise returning the number of connections to the node.
   */
  getConnectionCount () {
    return this.call({
      method: 'getconnectioncount',
      params: [],
      id: 0
    })
  }

  /**
   * Executes a 'test invoke' of a smart contract on the blockchain.
   * Note: This transcation will NOT be published to the blockchain.
   * @param {Object} payload
   * @param {Object} payload.scriptHash - The hash of the script to invoke.
   * @param {Object} payload.params - The params used to invoke the contract.
   * @returns {Promise.<Object>} The invoke response.
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
   * Executes a 'test invoke' of a smart contract on the blockchain.
   * Note: This transcation will NOT be published to the blockchain.
   * @public
   * @param {Object} payload
   * @param {Object} payload.scriptHash - The hash of the script to invoke.
   * @param {Object} payload.operation - Defines the operation to invoke on the contract.
   * @param {Object} payload.params - The params used to invoke the contract.
   * @returns {Promise.<Object>} The invoke response.
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
   * Executes a 'test invoke' of a smart contract on the blockchain.
   * Note: This transaction will NOT be published to the blockchain.
   * @public
   * @param script - raw script to invoke.
   * @returns {Promise.<Object>} The invoke response.
   */
  invokeScript (script) {
    return this.call({
      method: 'invokescript',
      params: [script],
      id: 0
    }).catch((_err) => Promise.reject(new Error('Unable to contact the requested node.')))
  }

  /**
   * @public
   * @returns {Promise.<Object>} The invoke response.
   */
  getRawMemPool () {
    return this.call({
      method: 'getrawmempool',
      params: [],
      id: 0
    }).catch((_err) => Promise.reject(new Error('Unable to contact the requested node.')))
  }

  /**
   * Polls the node for the raw transaction data associated with an input txid.
   * @public
   * @param {string} txid - The requested transaction ID.
   * @example
   * node.rpc.getRawTransaction('0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042')
   *  return {
   *    'txid': '0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042',
   *    'size': 10,
   *    'type': 'MinerTransaction',
   *    'version': 0,
   *    'attributes': [],
   *    'vin': [],
   *    'vout': [],
   *    'sys_fee': '0',
   *    'net_fee': '0',
   *    'scripts': [],
   *    'nonce': 1584347482,
   *    'blockhash': '0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122',
   *    'confirmations': 511280,
   *    'blocktime': 1496454840
   *  }
   * @returns {Promise.<Object>} An object containing the transaction information.
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
   * Polls the node for the raw transaction response associated with an input txid.
   * @public
   * @param {Object} payload
   * @param {string} payload.txid - The requested transaction ID.
   * @param {number} payload.index
   * @returns {Promise.<Object>} An object containing the transaction response.
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
   * Submits a raw transaction event to the blockchain.
   * @public
   * @param {string} hex - The hex string representing the raw transaction.
   * @returns {Promise.<Object>} The transaction response.
   */
  sendRawTransaction (hex) {
    return this.call({
      method: 'sendrawtransaction',
      params: [hex],
      id: 0
    })
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
    // { assetId, address, value }
    return this.call({
      method: 'sendtoaddress',
      params: [payload.assetId, payload.address, payload.value],
      id: 0
    })
  }

  /**
   * @public
   * @param {string} hex
   * @returns {Promise.<Object>}
   */
  submitBlock (hex) {
    return this.call({
      method: 'submitblock',
      params: [hex],
      id: 0
    })
  }

  /**
   * @public
   * @param {string} address
   * @returns {Promise.<Object>}
   */
  getAccountState (address) {
    return this.call({
      method: 'getaccountstate',
      params: [address],
      id: 0
    })
  }

  /**
   * @public
   * @param {string} asssetId
   * @returns {Promise.<Object>}
   */
  getAssetState (assetId) {
    return this.call({
      method: 'getassetstate',
      params: [assetId],
      id: 0
    })
  }

  /**
   * @public
   * @param {string} hash
   * @returns {Promise.<Object>}
   */
  getContractState (hash) {
    return this.call({
      method: 'getcontractstate',
      params: [hash],
      id: 0
    })
  }

  /**
   * @public
   * @param {string} address
   * @returns {Promise.<Object>}
   */
  validateAddress (address) {
    return this.call({
      method: 'validateaddress',
      params: [address],
      id: 0
    })
  }

  /**
   * @public
   * @returns {Promise.<Object>}
   */
  getPeers () {
    return this.call({
      method: 'getpeers',
      params: [],
      id: 0
    })
  }
}

module.exports = Rpc
