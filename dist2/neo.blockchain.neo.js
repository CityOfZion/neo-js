/**
 * 
 * @param {String} network can be either 'mainnet' or 'testnet'
 * @param {Object} options 
 */
const Neo = function (network, options = {}) {
  // Properties and default values
  this.network = network
  this.mode = options.mode || 'light'
  this._ = options._ || require('lodash')
  this.enum = options.enum || require('./neo.blockchain.enum')
  this.node = undefined;

  // Bootstrap
  this.setDefaultNode()
}

Neo.prototype = {
  setDefaultNode: function () {
    this.node = this.enum.nodes[this.network][0]
  },

  getCurrentNode: function () {
    return this.node
  },

  getCurrentNodeUrl: function () {
    return this.node.url + ':' + this.node.port
  },
}

module.exports = Neo