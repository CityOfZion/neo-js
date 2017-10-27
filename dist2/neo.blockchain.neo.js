const _ = require('lodash')
const EventEmitter = require('events')
const Rpc = require('./neo.blockchain.rpc')

/**
 * Neo blockchain client.
 * @class
 * @public
 * @param {String} network can be either 'mainnet' or 'testnet'
 * @param {Object} options 
 */
const Neo = function (network, options = {}) {
  // Properties and default values
  this.network = network
  this.options = _.assign({}, Neo.Defaults, options)

  this.nodes = _.cloneDeep(this.options.enum.nodes[this.network]) // Make a carbon copy of the available nodes. This object will contain additional attributes.
  this.currentNode = undefined
  this.rpc = undefined
  // TODO: have some worker in the background that keep pining getBlockCount in order to fetch height and speed info. Make this a feature toggle
  // TODO: cache mechanism, in-memory, vs mongodb?
  // TODO: auto (re)pick 'an appropriate' node

  // Bootstrap
  this.setDefaultNode()
  this._diagnosticProcess() // Again, haven't come up with a suitable terminology yet.

  // Event bindings
  // TODO: pink elephant: is event emitter usage going to be heavy on process/memory?
  // this.options.eventEmitter.on('rpc:getblockcount:response', (e) => {
  // })
}

/**
 * Default options for Neo blockchain client.
 * @public
 */
Neo.Defaults = {
  // mode: 'light', // DEPRECATED
  eventEmitter: new EventEmitter(),
  verboseLevel: 2, // 0: off, 1: error, 2: warn, 3: log
  enum: require('./neo.blockchain.enum'), // User has the choice to BYO own enum definitions
  diagnosticInterval: 0 // How often to analyse a node. 0 means disable.
}

Neo.prototype = {
  setDefaultNode: function () {
    const node = this.nodes[0] // Always pick the first node in the list as default choice
    this._setCurrentNode(node)
  },

  setFastestNode: function () {
    this._setCurrentNode(this.getFastestNode())
  },

  setHighestNode: function () {
    this._setCurrentNode(this.getHighestNode())
  },

  getFastestNode: function () {
    return _.minBy(_.filter(this.nodes, 'active'), 'latency') || this.nodes[0]
  },

  getHighestNode: function () {
    return _.maxBy(_.filter(this.nodes, 'active'), 'blockHeight') || this.nodes[0]
  },

  getCurrentNode: function () {
    return this.currentNode
  },

  getCurrentNodeUrl: function () {
    return this.getNodeUrl(this.currentNode)
  },

  getNodeUrl: function (node) {
    return node.url + ':' + node.port
  },

  // -- Private methods

  _diagnosticProcess: function () {
    if(this.options.diagnosticInterval > 0) {
      setInterval(() => {
        this._diagnoseRandomNode()
      }, this.options.diagnosticInterval);

      // -- Experiment
      if(this.options.verboseLevel >= 3) { // Provide an update on the ladderboard
        setInterval(() => {
          const fNode = this.getFastestNode()
          console.log('!! Fastest node:', this.getNodeUrl(fNode), 'latency:', fNode.latency);
          const hNode = this.getHighestNode()
          console.log('!! Highest node:', this.getNodeUrl(hNode), 'blockHeight:', hNode.blockHeight);
        }, 10000)  
      }
    }
  },

  _diagnoseRandomNode: function () {
    // TODO: instead of randomised targetIndex, adapt a better algorithm?
    // TODO: use webworker?
    const targetIndex = Math.floor(Math.random() * this.nodes.length)
    const targetNode = this.nodes[targetIndex]

    if(this.options.verboseLevel >= 3) {
      console.log('=> #' + targetIndex, 'node:', this.getNodeUrl(targetNode))
    }

    if(!targetNode.rpc) { // Lazy load RPC client of a node
      targetNode.rpc = new Rpc(this.getNodeUrl(targetNode), { eventEmitter: this.options.eventEmitter })
    }

    const startTime = new Date() // Start timer
    targetNode.rpc.getBlockCount()
      .then((res) => {
        const latency = (new Date()) - startTime // Resolved time in milliseconds
        targetNode.active = true
        targetNode.blockHeight = res
        targetNode.latency = latency

        if(this.options.verboseLevel >= 3) {
          console.log('<= #' + targetIndex, 'node:', this.getNodeUrl(targetNode), 'block count:', res)
        }
      })
      .catch((err) => {
        targetNode.active = false

        if(this.options.verboseLevel >= 3) {
          console.log('<= #' + targetIndex, 'node:', this.getNodeUrl(targetNode), 'error:', err.message)
        }
      })
  },

  _setCurrentNode: function(node) {
    this.currentNode = node
    if(!this.currentNode.rpc) { // Lazy load if hasn't been instantiated yet
      this.currentNode.rpc = new Rpc(this.getCurrentNodeUrl(), { eventEmitter: this.options.eventEmitter })
    }
    this.rpc = this.currentNode.rpc // Set alias
  },

}

module.exports = Neo