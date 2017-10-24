const Rpc = require('./neo.blockchain.rpc')

/**
 * 
 * @param {String} network can be either 'mainnet' or 'testnet'
 * @param {Object} options 
 */
const Neo = function (network, options = {}) {
  // Properties and default values
  this.network = network
  this.mode = options.mode || 'light' // Default to 'light' wallet mode if not specified.
  this._ = options._ || require('lodash') // User has the choice of BYO utility library
  this.enum = options.enum || require('./neo.blockchain.enum') // User has the choice to BYO own enum definitions
  this.nodes = this._.cloneDeep(this.enum.nodes[this.network]) // Make a carbon copy of the available nodes. This object will contain additional attributes.
  this.currentNode = undefined
  this.rpc = undefined

  // Bootstrap
  this.setDefaultNode()
}

Neo.prototype = {
  setDefaultNode: function () {
    this.currentNode = this.nodes[0] // Always pick the first node in the list as default choice
    this.rpc = new Rpc(this.getCurrentNodeUrl()) // (Re)initiates RPC client instance
  },

  setFastestNode: function () {
    this.currentNode = this._.minBy(this._.filter(this.nodes, 'active'), 'latency') || this.nodes[0]
    this.rpc = new Rpc(this.getCurrentNodeUrl())
  },

  setHighestNode: function () {
    this.currentNode = this._.maxBy(this._.filter(this.nodes, 'active'), 'blockHeight') || this.nodes[0]
    this.rpc = new Rpc(this.getCurrentNodeUrl())
  },

  getCurrentNode: function () {
    return this.currentNode
  },

  getCurrentNodeUrl: function () {
    return this.currentNode.url + ':' + this.currentNode.port
  },

  /**
   * This is experimental method, serves no real purpose.
   */
  findCurrentNode: function () {
    this.nodes.forEach((needleNode) => {
      if(needleNode == this.currentNode) {
        console.log('FOUND! needleNode:', needleNode)
      }
    })
  },
}

module.exports = Neo