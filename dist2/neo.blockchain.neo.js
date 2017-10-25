const Rpc = require('./neo.blockchain.rpc')
const EventEmitter = require('events')

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
  this.eventEmitter = new EventEmitter()
  this.nodes = this._.cloneDeep(this.enum.nodes[this.network]) // Make a carbon copy of the available nodes. This object will contain additional attributes.
  this.currentNode = undefined
  this.rpc = undefined
  // TODO: have some worker in the background that keep pining getBlockCount in order to fetch height and speed info. Make this a feature toggle
  // TODO: verbose setting

  // Bootstrap
  this.setDefaultNode()

  // Event bindings
  // TODO: pink elephant: is this heavy?
  this.eventEmitter.on('rpc:getblockcount:response', (e) => {
    console.log('rpc:getblockcount:response triggered. e:', e)
    this.currentNode.blockHeight = e.result
    this.currentNode.latency = e.latency
  })
  
  // TODO: how to set 'active' state per node?
}

Neo.prototype = {
  setDefaultNode: function () {
    const node = this.nodes[0] // Always pick the first node in the list as default choice
    this._setCurrentNode(node)
  },

  setFastestNode: function () {
    const node = this._.minBy(this._.filter(this.nodes, 'active'), 'latency') || this.nodes[0]
    this._setCurrentNode(node)
  },

  setHighestNode: function () {
    const node = this._.maxBy(this._.filter(this.nodes, 'active'), 'blockHeight') || this.nodes[0]
    this._setCurrentNode(node)
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

  // -- Private methods

  _setCurrentNode: function(node) {
    this.currentNode = node
    if(!this.currentNode.rpc) { // Lazy load if hasn't been instantiated yet
      this.currentNode.rpc = new Rpc(this.getCurrentNodeUrl(), { eventEmitter: this.eventEmitter })
    }
    this.rpc = this.currentNode.rpc // Set alias
  },

}

module.exports = Neo