const _ = require('lodash')
const EventEmitter = require('events')
const Rpc = require('./neo.blockchain.rpc')
const Db = require('./neo.blockchain.db')
const mongoose = require('mongoose')

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
  // this.localNode = undefined
  this.db = undefined
  // TODO: have some worker in the background that keep pining getBlockCount in order to fetch height and speed info. Make this a feature toggle
  // TODO: cache mechanism, in-memory, vs mongodb?
  // TODO: auto (re)pick 'an appropriate' node

  // Bootstrap
  this.setDefaultNode()
  this._initDiagnostic() // Again, haven't come up with a suitable terminology yet.
  // this._initLocalNode()
  this._initFullMode()

  // Event bindings
  // TODO: pink elephant: is event emitter usage going to be heavy on process/memory?
  this.options.eventEmitter.on('rpc:call', (e) => {
    if (this.verboseLevel >= 3) {
      console.log('rpc:call triggered. e:', e)
    }
    const node = _.find(this.nodes, { url: e.url })
    node.pendingRequests += 1
  })
  this.options.eventEmitter.on('rpc:call:response', (e) => {
    if (this.verboseLevel >= 3) {
      console.log('rpc:call:response triggered. e:', e)
    }
    const node = _.find(this.nodes, { url: e.url })
    node.pendingRequests -= 1
  })
  this.options.eventEmitter.on('rpc:call:error', (e) => {
    if (this.verboseLevel >= 3) {
      console.log('rpc:call:error triggered. e:', e)
    }
    const node = _.find(this.nodes, { url: e.url })
    node.pendingRequests -= 1
  })
}

/**
 * Default options for Neo blockchain client.
 * @public
 */
Neo.Defaults = {
  mode: 'light', // DEPRECATING
  eventEmitter: new EventEmitter(),
  verboseLevel: 2, // 0: off, 1: error, 2: warn, 3: log
  enum: require('./neo.blockchain.enum'), // User has the choice to BYO own enum definitions
  diagnosticInterval: 0, // How often to analyse a node. 0 means disable.
  // localNodeEnabled: false
}

// -- Static methods

Neo.GetNodeUrl = function (node) {
  return `${node.scheme}://${node.host}:${node.port}`
}

// -- Class methods

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
    return this.currentNode.url
  },

  // -- RPC Delegates

  getBalance: function (assetId) {
    // TODO
    return this.currentNode.rpc.getBalance(assetId)
  },

  getBestBlockHash: function () {
    // TODO
    return this.currentNode.rpc.getBestBlockHash()
  },

  getBlock: function (index) {
    // TODO: check if this instance uses local data access
    // TODO: if so, attempt to get value from data access
    // TODO: if not found, obtain data from RPC
    // TODO: store data into data access

    if (this.db) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getBlock from DB...')
      }
      const block = this.db.getBlock(index)
      if(block) {
        if (this.verboseLevel >= 3) {
          console.log('getBlock result found in DB!')
        }
        return block
      }
      // TODO: fetch from RPC and store into db
    }

    return this.currentNode.rpc.getBlock(index)
  },

  getBlockByHash: function (hash) {
    // TODO
    return this.currentNode.rpc.getBlockByHash(hash)
  },

  getBlockCount: function () {
    // TODO: check if this instance uses local data access
    // TODO: if so, attempt to find out if it is fully sync'ed
    // TODO: if not, get value from RPC
    // TODO: if yes, obtain block count
    return this.currentNode.rpc.getBlockCount()
  },

  getBlockHash: function (index) {
    // TODO
    return this.currentNode.rpc.getBlockHash(index)
  },

  getBlockSystemFee: function (height) {
    // TODO
    return this.currentNode.rpc.getBlockSystemFee(height)
  },

  getConnectionCount: function () {
    // TODO
    return this.currentNode.rpc.getConnectionCount()
  },

  invoke: function (scriptHash, params) {
    // TODO
    return this.currentNode.rpc.invoke(scriptHash, params)
  },

  invokeFunction: function (scriptHash, operation, params) {
    // TODO
    return this.currentNode.rpc.invokeFunction(scriptHash, operation, params)
  },

  invokeScript: function (script) {
    // TODO
    return this.currentNode.rpc.invokeScript(script)
  },

  getRawMemPool: function () {
    // TODO
    return this.currentNode.rpc.getRawMemPool()
  },

  getRawTransaction: function (txid) {
    // TODO
    return this.currentNode.rpc.getRawTransaction(txid)
  },

  getTXOut: function (txid, index) {
    // TODO
    return this.currentNode.rpc.getTXOut(txid, index)
  },

  sendRawTransaction: function (hex) {
    // TODO
    return this.currentNode.rpc.sendRawTransaction(hex)
  },

  sendToAddress: function (assetId, address, value) {
    // TODO
    return this.currentNode.rpc.sendToAddress(assetId, address, value)
  },

  submitBlock: function (hex) {
    // TODO
    return this.currentNode.rpc.submitBlock(hex)
  },

  getAccountState: function (address) {
    // TODO
    return this.currentNode.rpc.getAccountState(address)
  },

  getAssetState: function (assetId) {
    // TODO
    return this.currentNode.rpc.getAssetState(assetId)
  },

  validateAddress: function (address) {
    // TODO
    return this.currentNode.rpc.validateAddress(address)
  },

  getPeers: function () {
    // TODO
    return this.currentNode.rpc.getPeers()
  },

  // -- Private methods

  _initDiagnostic: function () {
    if (this.options.diagnosticInterval <= 0) {
      return;
    }

    setInterval(() => {
      this._diagnoseRandomNode()
    }, this.options.diagnosticInterval)

    // -- Experiment
    if (this.options.verboseLevel >= 3) { // Provide an update on the ladderboard
      setInterval(() => {
        const fNode = this.getFastestNode()
        console.log('!! Fastest node:', fNode.url, 'latency:', fNode.latency, 'pendingRequests:', fNode.pendingRequests)
        const hNode = this.getHighestNode()
        console.log('!! Highest node:', hNode.url, 'blockHeight:', hNode.blockHeight, 'pendingRequests:', fNode.pendingRequests)
      }, 10000)
    }
  },

  _diagnoseRandomNode: function () {
    // TODO: instead of randomised targetIndex, adapt a better algorithm?
    // TODO: use webworker?
    const targetIndex = Math.floor(Math.random() * this.nodes.length)
    const targetNode = this.nodes[targetIndex]
    this._initNode(targetNode)

    if (this.options.verboseLevel >= 3) {
      console.log('=> #' + targetIndex, 'node:', targetNode.url)
    }

    const startTime = new Date() // Start timer
    targetNode.rpc.getBlockCount()
      .then((res) => {
        const latency = (new Date()) - startTime // Resolved time in milliseconds
        targetNode.active = true
        targetNode.blockHeight = res
        targetNode.latency = latency

        if (this.options.verboseLevel >= 3) {
          console.log('<= #' + targetIndex, 'node:', targetNode.url, 'block count:', res)
        }
      })
      .catch((err) => {
        targetNode.active = false

        if (this.options.verboseLevel >= 3) {
          console.log('<= #' + targetIndex, 'node:', targetNode.url, 'error:', err.message)
        }
      })
  },

  _setCurrentNode: function (node) {
    this._initNode(node)
    this.currentNode = node
  },

  _initNode: function (node) {
    if (!node.url) {
      node.url = Neo.GetNodeUrl(node)
    }
    if (!node.rpc) { // Lazy load if hasn't been instantiated yet
      node.rpc = new Rpc(node.url, { eventEmitter: this.options.eventEmitter })
    }
    if (!node.pendingRequests) {
      node.pendingRequests = 0
    }
  },

  // _initLocalNode: function () {
  //   if (!this.localNodeEnabled) {
  //     return;
  //   }

  //   const connectionInfo = this._getMongoDbConnectionInfo()
  //   const db = new Db(connectionInfo)
  //   this.localNode = db.getLocalNode()
  //   this.nodes.push(this.localNode)
  // },

  _initFullMode: function () {
    if (this.options.mode !== 'full') {
      return
    }

    const connectionInfo = this._getMongoDbConnectionInfo()
    this.db = new Db(connectionInfo)
  },

  _getMongoDbConnectionInfo: function () {
    return this.options.enum.mongodb[this.network]
  },

}

module.exports = Neo
