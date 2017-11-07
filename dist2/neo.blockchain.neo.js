const _ = require('lodash')
const mongoose = require('mongoose')
const EventEmitter = require('events')
const Rpc = require('./neo.blockchain.rpc')
const Node = require('./neo.blockchain.node')
const MongoDa = require('./neo.blockchain.da.mongodb')
const Sync = require('./neo.blockchain.sync')
const Utils = require('./neo.blockchain.utils')
const Logger = Utils.logger

/**
 * Neo blockchain client.
 * @todo have some worker in the background that keep pining getBlockCount in order to fetch height and speed info. Make this a feature toggle
 * @todo auto (re)pick 'an appropriate' node
 * @class
 * @public
 * @param {String} network - Can be either 'mainnet' or 'testnet'
 * @param {Object} options 
 */
const Neo = function (network, options = {}) {
  // Properties and default values
  this.network = network
  this.options = _.assign({}, Neo.Defaults, options)
  this.nodes = []
  this.currentNode = undefined // A reference pointer to a selected node as the current node
  this.localNode = undefined
  this.sync = undefined

  // Bootstrap
  Logger.setLevel(this.options.verboseLevel)
  this._initNodes()
  this._setDefaultNode()
  this._initDiagnostic() // Haven't come up with a suitable terminology yet.
  this._initLocalNode()

  // Event bindings
  if (this.options.eventEmitter) {
    // TODO: Are these event emitter usages going to be heavy on process/memory?
    this.options.eventEmitter.on('rpc:call', this._rpcCallHandler.bind(this))
    this.options.eventEmitter.on('rpc:call:response', this._rpcCallResponseHandler.bind(this))
    this.options.eventEmitter.on('rpc:call:error', this._rpcCallErrorHandler.bind(this))
  }
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
  localNodeEnabled: false
}

// -- Class methods

Neo.prototype = {

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

  /**
   * Identifies and returns the best node that has a specific block based on an input criteria.
   * @todo allow change of sorting order on input
   * @param {number} index - The index of the requested block.
   * @param {string} [sort='latency'] - The attribute to rank nodes by.
   * @param {Boolean} [allowLocal=true] - A flag to indicate whether the local node is allowed
   * @returns {node} The best node that has the requested block index.
   */
  getNodeWithBlock: function (index, sort = 'latency', allowLocal = true) {
    const filteredNodes = []
    filteredNodes = _.filter(this.nodes, (n) => {
      return n.active && n.index > index
    })
    if (!allowLocal) {
      filteredNodes = _.filter(filteredNodes, (n) => {
        return !n.isLocalNode()
      })
    }
    return _.minBy(filteredNodes, sort)
  },

  getCurrentNode: function () {
    return this.currentNode
  },

  getCurrentNodeUrl: function () {
    return this.currentNode.api.url
  },

  // -- RPC Delegates

  getBalance: function (assetId) {
    // TODO
    return this.currentNode.api.getBalance(assetId)
  },

  getBestBlockHash: function () {
    if (this.localNode) {
      Logger.info('[neo] fetching getBestBlockHash from DB...')
      // TODO: if so, attempt to find out if it is fully sync'ed
      try {
        return this.localNode.api.getBestBlockHash()
      } catch (err) {
        Logger.info('[neo] problem with getBestBlockHash in DB, fall back to RPC instead...')
        // TODO: fetch from RPC and store into DB
      }
    }
    return this.currentNode.api.getBestBlockHash()
  },

  getBlock: function (index) {
    if (this.localNode) {
      Logger.info('[neo] fetching getBlock from DB...')
      const block = this.localNode.api.getBlock(index)
      if (block) { // TODO: formal block validation util
        Logger.info('getBlock result found in DB!')
        return block
      }
      // TODO: fetch from RPC and store into DB
    }
    Logger.info('[neo] fetching getBlock from RPC...')
    return this.currentNode.api.getBlock(index)
  },

  getBlockByHash: function (hash) {
    if (this.localNode) {
      Logger.info('[neo] fetching getBlockByHash from DB...')
      const block = this.localNode.api.getBlockByHash(hash)
      if (block) { // TODO: formal block validation util
        Logger.info('getBlockByHash result found in DB!')
        return block
      }
      // TODO: fetch from RPC and store into DB
    }
    Logger.info('[neo] fetching getBlockByHash from RPC...')
    return this.currentNode.api.getBlockByHash(hash)
  },

  getBlockCount: function () {
    if (this.localNode) {
      Logger.info('[neo] fetching getBlockCount from DB...')
      // TODO: if so, attempt to find out if it is fully sync'ed
      try {
        return this.localNode.api.getBlockCount()
      } catch (err) {
        Logger.info('[neo] problem with getBlockCount in DB, fall back to RPC instead...')
      }
    }
    Logger.info('[neo] fetching getBlockCount from RPC...')
    return this.currentNode.api.getBlockCount()
  },

  getBlockHash: function (index) { // TODO: should this method simply reuses neo.getBlock() instead of having its own implementation?
    if (this.localNode) {
      Logger.info('[neo] fetching getBlockHash from DB...')
      const block = this.localNode.api.getBlock(index)
      if (block) { // TODO: formal block validation util
        Logger.info('[neo] getBlockHash result found in DB!')
        return block.hash
      }
      // TODO: fetch from RPC and store into DB
    }
    Logger.info('[neo] fetching getBlockHash from RPC...')
    return this.currentNode.api.getBlockHash(index)
  },

  getBlockSystemFee: function (height) {
    return this.currentNode.api.getBlockSystemFee(height)
  },

  getConnectionCount: function () {
    return this.currentNode.api.getConnectionCount()
  },

  invoke: function (scriptHash, params) {
    // TODO
    return this.currentNode.api.invoke(scriptHash, params)
  },

  invokeFunction: function (scriptHash, operation, params) {
    // TODO
    return this.currentNode.api.invokeFunction(scriptHash, operation, params)
  },

  invokeScript: function (script) {
    // TODO
    return this.currentNode.api.invokeScript(script)
  },

  getRawMemPool: function () {
    // TODO
    return this.currentNode.api.getRawMemPool()
  },

  getRawTransaction: function (txid) {
    if (this.localNode) {
      Logger.info('[neo] fetching getRawTransaction from DB...')
      const transaction = this.localNode.api.getRawTransaction(txid)
      if (transaction) { // TODO: formal tx validation util
        Logger.info('[neo] getRawTransaction result found in DB!')
        return transaction
      }
      // TODO: fetch from RPC and store into DB
    }
    Logger.info('[neo] fetching getRawTransaction from RPC...')
    return this.currentNode.api.getRawTransaction(txid)
  },

  getTXOut: function (txid, index) {
    // TODO
    return this.currentNode.api.getTXOut(txid, index)
  },

  sendRawTransaction: function (hex) {
    return this.currentNode.api.sendRawTransaction(hex)
  },

  sendToAddress: function (assetId, address, value) {
    return this.currentNode.api.sendToAddress(assetId, address, value)
  },

  submitBlock: function (hex) {
    return this.currentNode.api.submitBlock(hex)
  },

  getAccountState: function (address) {
    // TODO
    return this.currentNode.api.getAccountState(address)
  },

  getAssetState: function (assetId) {
    // TODO
    return this.currentNode.api.getAssetState(assetId)
  },

  validateAddress: function (address) {
    return this.currentNode.api.validateAddress(address)
  },

  getPeers: function () {
    return this.currentNode.api.getPeers()
  },

  // -- Event Handlers

  _rpcCallHandler: function (e) {
    // Logger.info('rpc:call triggered. e:', e)
    const node = _.find(this.nodes, (node) => { return node.api.url === e.url })
    node.pendingRequests += 1
  },

  _rpcCallResponseHandler: function (e) {
    // Logger.info('rpc:call:response triggered. e:', e)
    const node = _.find(this.nodes, (node) => { return node.api.url === e.url })
    node.pendingRequests -= 1
    if (e.method === 'getblockcount') {
      node.blockHeight = e.result
      node.index = ndoe.blockHeight - 1
    }
  },

  _rpcCallErrorHandler: function (e) {
    // Logger.info('rpc:call:error triggered. e:', e)
    const node = _.find(this.nodes, (node) => { return node.api.url === e.url })
    node.pendingRequests -= 1
  },

  // -- Private methods

  _setDefaultNode: function () {
    const node = this.nodes[0] // Always pick the first node in the list as default choice
    this._setCurrentNode(node)
  },

  _initNodes: function () {
    this.options.enum.nodes[this.network].forEach((nodeInfo) => {
      const nodeUrl = `${nodeInfo.scheme}://${nodeInfo.host}:${nodeInfo.port}`
      const rpc = new Rpc(nodeUrl, { eventEmitter: this.options.eventEmitter, verboseLevel: this.options.verboseLevel })
      const node = new Node(rpc, { eventEmitter: this.options.eventEmitter, verboseLevel: this.options.verboseLevel })
      this.nodes.push(node)
    })
  },

  _initDiagnostic: function () {
    if (this.options.diagnosticInterval <= 0) {
      return
    }

    setInterval(() => {
      this._diagnoseRandomNode()
    }, this.options.diagnosticInterval)

    // -- Experiment
    if (this.options.verboseLevel >= 3) { // Provide an update on the ladderboard
      setInterval(() => {
        /**
         * Example diagnostic information:
         * !! Active nodes: 11 / 12
         * !! Fastest node: http://seed4.neo.org:20332 latency: 321 pendingRequests: 0
         * !! Highest node: http://seed2.neo.org:20332 blockHeight: 746169 pendingRequests: 0
         */
        const activeNodeCount = _.filter(this.nodes, 'active').length
        console.log(`!! Active nodes: ${activeNodeCount} / ${this.nodes.length}`)
        const fNode = this.getFastestNode()
        console.log('!! Fastest node:', fNode.api.url, 'latency:', fNode.latency, 'pendingRequests:', fNode.pendingRequests)
        const hNode = this.getHighestNode()
        console.log('!! Highest node:', hNode.api.url, 'blockHeight:', hNode.blockHeight, 'pendingRequests:', fNode.pendingRequests)
      }, 10000)
    }
  },

  _diagnoseRandomNode: function () {
    // TODO: instead of randomised targetIndex, adapt a better algorithm?
    // TODO: use webworker?
    const targetIndex = Math.floor(Math.random() * this.nodes.length)
    const targetNode = this.nodes[targetIndex]
    Logger.info('=> #' + targetIndex, 'api:', targetNode.api.url)

    const startTime = new Date() // Start timer
    targetNode.api.getBlockCount()
      .then((res) => {
        const latency = (new Date()) - startTime // Resolved time in milliseconds
        targetNode.active = true
        targetNode.blockHeight = res
        targetNode.latency = latency
        Logger.info('<= #' + targetIndex, 'node:', targetNode.api.url, 'block count:', res)
      })
      .catch((err) => {
        targetNode.active = false
        Logger.info('<= #' + targetIndex, 'node:', targetNode.api.url, 'error:', err.message)
      })
  },

  _setCurrentNode: function (node) {
    this.currentNode = node
  },

  _initLocalNode: function () {
    if (!this.options.localNodeEnabled) {
      return
    }

    // Setup a Data Access Object as API of local node
    const connectionInfo = this._getMongoDbConnectionInfo()
    Logger.info('Enabling local node. connectionInfo:', connectionInfo)
    const db = new MongoDa(connectionInfo, { verboseLevel: this.options.verboseLevel }) // TODO: have an abstract layer so user can inject any types of Data Access Object
    const node = new Node(db, { eventEmitter: this.options.eventEmitter, verboseLevel: this.options.verboseLevel })
    this.localNode = node
    this.nodes.push(node)

    // Setup sync instance
    this.sync = new Sync(this, this.localNode, { eventEmitter: this.options.eventEmitter, verboseLevel: this.options.verboseLevel })
  },

  _getMongoDbConnectionInfo: function () {
    return this.options.enum.mongodb[this.network]
  },

}

module.exports = Neo
