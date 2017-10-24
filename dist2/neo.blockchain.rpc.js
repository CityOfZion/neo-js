/**
 * 
 * @param {String} nodeUrl
 * @param {Object} options 
 */
const Rpc = function (nodeUrl, options = {}) {
  // Properties and default values
  this.nodeUrl = nodeUrl
  this.axios = options.axios || require('axios') // TODO: perhaps rename the HTTP client to a general name, like 'httpClient'
  this.eventEmitter = options.eventEmitter || null // Unlike the other options, the default of this is null when unprovided  
}

Rpc.prototype = {
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

  _call: function (payload) {
    return new Promise((resolve, reject) => {
      this.axios({
        method: 'post',
        url: this.nodeUrl,
        data: {
          jsonrpc: '2.0',
          method: payload.method,
          params: payload.params,
          id: payload.id,
        },
        timeout: 20000 // TODO: refactor magic number
      })
        .then((res) => {
          // console.log('this.nodeUrl:', this.nodeUrl)
          if(this.eventEmitter) {
            //TODO: calculate request resolve time
            this.eventEmitter.emit(`rpc:${payload.method}`, { params: payload.params, result: res.data.result })
          }
          resolve(res.data.result)
        })
        .catch((err) => {
          //TODO: emit stuff?
          reject(err)
        })
    })
  },
}

module.exports = Rpc