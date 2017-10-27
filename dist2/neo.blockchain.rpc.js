const _ = require('lodash')
const axios = require('axios')

/**
 * Neo RPC client.
 * @class
 * @public
 * @param {String} nodeUrl
 * @param {Object} options 
 */
const Rpc = function (nodeUrl, options = {}) {
  // Properties and default values
  this.nodeUrl = nodeUrl
  this.options = _.assign({}, Rpc.Defaults, options)
}

/**
 * Default options for RPC client.
 * @public
 */
Rpc.Defaults = {
  eventEmitter: null
}

Rpc.prototype = {
  /**
   * Gets the NEO and GAS balance of an address.
   * @param {string} assetId The address to get the balance of.
   * @returns {Promise.<Object>} A promise containing the address balances.
   */
  getBalance: function () {
    return this._call({
      method: 'getbalance',
      params: [],
      id: 0
    })
  },

  /**
   * Gets the best block hash on the node
   * @example
   * node.getBestBlockHash()
   * return 0x051b5bf812db0536e488670b26abf3a45a5e1a400595031cf9a57416bea0b973
   * @returns {Promise.<Object>}
   */
  getBestBlockHash: function () {
    return this._call({
      method: 'getbestblockhash',
      params: [],
      id: 0
    })
  },

  /**
   * Invokes the getblock rpc request to return a block.  This method
   * accepts and optional node to request the block from.  If a node is not selected,
   * the fastest node will be used with failover in an attempt to guarantee a response.
   *
   * @example
   * node.getBlock(100000)
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
   * @param {number} index The index of the block being requested.
   * @returns {Promise.<string>} A promise returning the hex contents of the block
   */
  getBlock: function(index) {
    return this._call({
      method: 'getblock',
      params: [index, 1],
      id: 0
    })
  },

  /**
   * Invokes the getblock rpc request to return a block.  This method
   * accepts and optional node to request the block from.  If a node is not selected,
   * the fastest node will be used with failover in an attempt to guarantee a response.
   *
   * @example
   * node.getBlockByHash('0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122')
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
   * @param {string} hash The hash of the block being requested.
   * @returns {Promise.<Object>} A promise returning information of the block
   */
  getBlockByHash: function (hash) {
    return this._call({
      method: 'getblock',
      params: [hash, 1],
      id: 0
    })
  },

  /**
   * Invokes the getblockcount rpc request to return the block height.  This
   * method will request the block height from the fastest active node with failover if a
   * node is not provided.  This method will update the blockHeight attribute
   * on the node it is run on.
   *
   * @example
   * node.getBlockCount()
   * return 1000000
   * @returns {Promise.<number>} A promise returning the block count.
   */
  getBlockCount: function() {
    return this._call({
      method: 'getblockcount',
      params: [],
      id: 0
    })
  },

  /**
   * Invokes the getblockhash rpc request to return a block's hash.  This method
   * accepts and optional node to request the block from.  If a node is not selected,
   * the fastest node will be used with failover in an attempt to guarantee a response.
   *
   * @param {number} index The index of the block hash being requested.
   * @example
   * node.getBlockHash(100000)
   * return '0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122'
   * @returns {Promise.<string>} A promise returning the hash of the block
   */
  getBlockHash: function (index) {
    return this._call({
      method: 'getblockhash',
      params: [index],
      id: 0
    })
  },

  /**
   * Invokes the getblocksysfee rpc request to return system fee.
   *
   * @param {number} index The index of the block hash being requested.
   * @example
   * node.getBlockSystemFee(100000)
   * return 905
   * @returns {Promise.<String>} The system fee.
   */
  getBlockSystemFee: function (height) {
    return this._call({
      method: 'getblocksysfee',
      params: [height],
      id: 0
    })
  },

  /**
   * Invokes the getconnectioncount rpc request to return the number of connections to
   * the selected node.
   *
   * @example
   * node.getConnectionCount()
   * return 10
   * @returns {Promise.<number>} A promise returning the number of connections to the node.
   */
  getConnectionCount: function () {
    return this._call({
      method: 'getconnectioncount',
      params: [],
      id: 0
    })
  },

  /**
   * Executes a 'test invoke' of a smart contract on the blockchain.
   * Note: This transcation will NOT be published to the blockchain.
   * @param scriptHash  The hash of the script to invoke.
   * @param params The params used to invoke the contract.
   * @returns {Promise.<Object>) The invoke response.
   */
  invoke: function (scriptHash, params) {
    return this._call({
      method: 'invoke',
      params: [scriptHash, params],
      id: 0
    })
  },

  /**
   * Executes a 'test invoke' of a smart contract on the blockchain.
   * Note: This transcation will NOT be published to the blockchain.
   * @param scriptHash  The hash of the script to invoke.
   * @param operation Defines the operation to invoke on the contract.
   * @param params The params used to invoke the contract.
   * @returns {Promise.<Object>) The invoke response.
   */
  invokeFunction: function (scriptHash, operation, params) {
    return this._call({
      method: 'invokefunction',
      params: [scriptHash, operation, params],
      id: 0
    })
  },

  /**
   * Executes a 'test invoke' of a smart contract on the blockchain.
   * Note: This transcation will NOT be published to the blockchain.
   * @param script raw script to invoke.
   * @returns {Promise.<Object>) The invoke response.
   */
  invokeScript: function (script) {
    return this._call({
      method: 'invokescript',
      params: [script],
      id: 0
    })
  },

  /**
   * TBA
   */
  getRawMemPool: function () {
    return this._call({
      method: 'getrawmempool',
      params: [],
      id: 0
    })
  },

  /**
   * Polls the node for the raw transaction data associated with an input txid.
   * @param {string} txid The requested transaction ID.
   * @example
   * node.getRawTransaction('0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042')
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
  getRawTransaction: function (txid) {
    return this._call({
      method: 'getrawtransaction',
      params: [txid, 1],
      id: 0
    })
  },

  /**
   * Polls the node for the raw transaction response associated with an input txid.
   * @param {string} txid The requested transaction ID.
   * @returns {Promise.<Object>} An object containing the transaction response.
   */
  getTXOut: function (txid, index) {
    return this._call({
      method: 'gettxout',
      params: [txid, index],
      id: 0
    })
  },

  /**
   * Submits a raw transaction event to the blockchain.
   * @param {string} hex The hex string representing the raw transaction.
   * @returns {Promise.<Object>} The transaction response.
   */
  sendRawTransaction: function (hex) {
    return this._call({
      method: 'sendrawtransaction',
      params: [hex],
      id: 0
    })
  },

  /**
   * TBA
   */
  sendToAddress: function (assetId, address, value) {
    return this._call({
      method: 'sendtoaddress',
      params: [assetId, address, value],
      id: 0
    })
  },

  /**
   * TBA
   */
  submitBlock: function (hex) {
    return this._call({
      method: 'submitblock',
      params: [hex],
      id: 0
    })
  },

  /**
   * Invokes the getaccountstate rpc request to return information of requested account.
   *
   * @param {string} address The address of the wallet being requested.
   * node.getAccountState('Adii5po62hCCS9s9upsK6bXdWJosjHBt4G')
   * @example
   *  return {
   *    "version": 0,
   *    "script_hash": "0x869575db91de0265118002f26e00fe1d4a89b9f0",
   *    "frozen": false,
   *    "votes": [],
   *    "balances": [{
   *        "asset": "0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7",
   *        "value": "1488.1"
   *      },
   *      {
   *        "asset": "0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
   *        "value": "186"
   *      }
   *    ]
   *  }
   * @returns {Promise.<Object>} An object containing the account information.
   */
  getAccountState: function (address) {
    return this._call({
      method: 'getaccountstate',
      params: [address],
      id: 0
    })
  },

  /**
   * Invokes the getassetstate rpc request to return information of requested asset.
   *
   * @param {string} assetId The address of the asset being requested.
   * @example
   * node.getAssetState('0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b')
   *  return {
   *    "version": 0,
   *    "id": "0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
   *    "type": "GoverningToken",
   *    "name": [{
   *      "lang": "zh-CN",
   *      "name": "\u5C0F\u8681\u80A1"
   *    }, {
   *      "lang": "en",
   *      "name": "AntShare"
   *    }],
   *    "amount": "100000000",
   *    "available": "100000000",
   *    "precision": 0,
   *    "owner": "00",
   *    "admin": "Abf2qMs1pzQb8kYk9RuxtUb9jtRKJVuBJt",
   *    "issuer": "Abf2qMs1pzQb8kYk9RuxtUb9jtRKJVuBJt",
   *    "expiration": 4000000,
   *    "frozen": false
   *  }
   * @returns {Promise.<Object>} An object containing the asset information.
   */
  getAssetState: function (assetId) {
    return this._call({
      method: 'getassetstate',
      params: [assetId],
      id: 0
    })
  },

  /**
   * Invokes the validateaddress rpc request to verify a requested address.
   *
   * @param {string} address The address of the wallet being requested.
   * @example
   * node.validateAddress('Adii5po62hCCS9s9upsK6bXdWJosjHBt4G')
   *  return {
   *    address: 'Adii5po62hCCS9s9upsK6bXdWJosjHBt4G',
   *    isvalid: true
   *  }
   * @returns {Promise.<Object>} An object containing the validation information of the requested account.
   */
  validateAddress: function (address) {
    return this._call({
      method: 'validateaddress',
      params: [address],
      id: 0
    })
  },

  /**
   * TBA
   */
  getPeers: function () {
    return this._call({
      method: 'getpeers',
      params: [],
      id: 0
    })
  },

  _call: function (payload) {
    const startTime = new Date() // Start timer
    const TIMEOUT_MS = 20000

    this._emit('rpc:call', { url: this.nodeUrl, method: payload.method, params: payload.params })
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: this.nodeUrl,
        data: {
          jsonrpc: '2.0',
          method: payload.method,
          params: payload.params,
          id: payload.id,
        },
        timeout: TIMEOUT_MS
      })
        .then((res) => {
          const latency = (new Date()) - startTime // Resolved time in milliseconds
          this._emit('rpc:call:response', { url: this.nodeUrl, method: payload.method, params: payload.params, result: res.data.result, latency })
          resolve(res.data.result)
        })
        .catch((err) => {
          const latency = (new Date()) - startTime
          this._emit('rpc:call:error', { url: this.nodeUrl, method: payload.method, params: payload.params, error: err, latency })
          reject(err)
        })
    })
  },

  _emit: function (name, payload) {
    if(this.options.eventEmitter) {
      this.options.eventEmitter.emit(name, payload)
    }
  },
}

module.exports = Rpc