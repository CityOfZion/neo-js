/**
 * 
 * @param {String} network can be either 'mainnet' or 'testnet'
 * @param {Object} options 
 */
const Rpc = function (nodeUrl, options = {}) {
  // Properties and default values
  this.nodeUrl = nodeUrl
  this.axios = options.axios || require('axios')
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
          resolve(res.data.result)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
}

module.exports = Rpc