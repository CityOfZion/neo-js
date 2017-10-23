/**
 * 
 * @param {String} network can be either 'mainnet' or 'testnet'
 * @param {Object} options 
 */
const Rpc = function (network, options = {}) {
  // Properties and default values
  this.network = network
  this.enum = options.enum || require('./neo.blockchain.enum')
  this._ = options._ || require('lodash')
  this.axios = options.axios || require('axios')
  this.node = undefined

  // Bootstrap
  this.setDefaultSeed()
}

Rpc.prototype = {
  setDefaultSeed: function () {
    this.seed = this.enum.seeds[this.network][0]
  },

  getCurrentSeed: function () {
    return this.seed
  },

  getCurrentSeedUrl: function () {
    return this.seed.url + ':' + this.seed.port
  },

  getBestBlockHash: function () {
    return this._call({
      method: 'getbestblockhash',
      params: [],
      id: 0
    })
  },

  _call: function (payload) {
    return new Promise((resolve, reject) => {
      this.axios({
        method: 'post',
        url: this.getCurrentSeedUrl(),
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