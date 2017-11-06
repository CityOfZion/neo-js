const _ = require('lodash')
const mongoose = require('mongoose')
const EventEmitter = require('events')
const Rpc = require('./neo.blockchain.rpc')
const Node = require('./neo.blockchain.node')
// const MongoDa = require('./neo.blockchain.da.mongodb')
const Sync = require('./neo.blockchain.sync')

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

  // this.nodes = _.cloneDeep(this.options.enum.nodes[this.network]) // Make a carbon copy of the available nodes. This object will contain additional attributes.
  this.nodes = []
  this.currentNode = undefined
  // this.localNode = undefined
  this.dataAccess = undefined
  // TODO: have some worker in the background that keep pining getBlockCount in order to fetch height and speed info. Make this a feature toggle
  // TODO: cache mechanism, in-memory, vs mongodb?
  // TODO: auto (re)pick 'an appropriate' node

  // Bootstrap
  this._initNodes()
  this._setDefaultNode()
  this._initDiagnostic() // Hhaven't come up with a suitable terminology yet.
  // this._initLocalNode()
  this._initFullMode()

  // Event bindings
  if (this.options.eventEmitter) {
    // TODO: pink elephant: is event emitter usage going to be heavy on process/memory?
    this.options.eventEmitter.on('rpc:call', (e) => {
      if (this.verboseLevel >= 3) {
        console.log('rpc:call triggered. e:', e)
      }
      const node = _.find(this.nodes, (node) => { return node.api.url === e.url })
      node.pendingRequests += 1
    })
    this.options.eventEmitter.on('rpc:call:response', (e) => {
      if (this.verboseLevel >= 3) {
        console.log('rpc:call:response triggered. e:', e)
      }
      const node = _.find(this.nodes, (node) => { return node.api.url === e.url })
      node.pendingRequests -= 1
    })
    this.options.eventEmitter.on('rpc:call:error', (e) => {
      if (this.verboseLevel >= 3) {
        console.log('rpc:call:error triggered. e:', e)
      }
      const node = _.find(this.nodes, (node) => { return node.api.url === e.url })
      node.pendingRequests -= 1
    })
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
  // localNodeEnabled: false
}

// -- Static methods

Neo.GetNodeUrl = function (node) {
  return `${node.scheme}://${node.host}:${node.port}`
}

// -- Class methods

Neo.prototype = {
  _setDefaultNode: function () {
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
    return this.currentNode.api.url
  },

  // -- RPC Delegates

  getBalance: function (assetId) {
    // TODO
    return this.currentNode.api.getBalance(assetId)
  },

  getBestBlockHash: function () {
    if (this.dataAccess) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getBestBlockHash from DB...')
      }

      // TODO: if so, attempt to find out if it is fully sync'ed

      try {
        return this.dataAccess.getBestBlockHash()
      } catch (err) {
        // if there's problem with getBlockCount, then we fall back to fetching info from RPC
        if (this.verboseLevel >= 3) {
          console.log('problem with getBestBlockHash in DB, fall back to RPC instead...')
        }
      }
    }

    return this.currentNode.api.getBestBlockHash()
  },

  getBlock: function (index) {
    if (this.dataAccess) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getBlock from DB...')
      }
      const block = this.dataAccess.getBlock(index)
      if (block) { // TODO: formal block validation util
        if (this.verboseLevel >= 3) {
          console.log('getBlock result found in DB!')
        }
        return block
      }
      // TODO: fetch from RPC and store into db
    }

    return this.currentNode.api.getBlock(index)
  },

  getBlockByHash: function (hash) {
    if (this.dataAccess) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getBlockByHash from DB...')
      }
      const block = this.dataAccess.getBlockByHash(hash)
      if (block) { // TODO: formal block validation util
        if (this.verboseLevel >= 3) {
          console.log('getBlockByHash result found in DB!')
        }
        return block
      }
      // TODO: fetch from RPC and store into db
    }

    return this.currentNode.api.getBlockByHash(hash)
  },

  getBlockCount: function () {
    if (this.dataAccess) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getBlockCount from DB...')
      }

      // TODO: if so, attempt to find out if it is fully sync'ed

      try {
        return this.dataAccess.getBlockCount()
      } catch (err) {
        // if there's problem with getBlockCount, then we fall back to fetching info from RPC
        if (this.verboseLevel >= 3) {
          console.log('problem with getBlockCount in DB, fall back to RPC instead...')
        }
      }
    }

    return this.currentNode.api.getBlockCount()
  },

  getBlockHash: function (index) {
    if (this.dataAccess) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getBlock from DB...')
      }
      const block = this.dataAccess.getBlock(index)
      if (block) { // TODO: formal block validation util
        if (this.verboseLevel >= 3) {
          console.log('getBlock result found in DB!')
        }
        return block.hash
      }
      // TODO: fetch from RPC and store into db
    }

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
    if (this.dataAccess) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getRawTransaction from DB...')
      }
      const transaction = this.dataAccess.getRawTransaction(txid)
      if (transaction) { // TODO: formal tx validation util
        if (this.verboseLevel >= 3) {
          console.log('getRawTransaction result found in DB!')
        }
        return transaction
      }
      // TODO: fetch from RPC and store into db
    }

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

  // -- Private methods

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
      return;
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

    if (this.options.verboseLevel >= 3) {
      console.log('=> #' + targetIndex, 'api:', targetNode.api.url)
    }

    const startTime = new Date() // Start timer
    targetNode.api.getBlockCount()
      .then((res) => {
        const latency = (new Date()) - startTime // Resolved time in milliseconds
        targetNode.active = true
        targetNode.blockHeight = res
        targetNode.latency = latency

        if (this.options.verboseLevel >= 3) {
          console.log('<= #' + targetIndex, 'node:', targetNode.api.url, 'block count:', res)
        }
      })
      .catch((err) => {
        targetNode.active = false

        if (this.options.verboseLevel >= 3) {
          console.log('<= #' + targetIndex, 'node:', targetNode.api.url, 'error:', err.message)
        }
      })
  },

  _setCurrentNode: function (node) {
    this.currentNode = node
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
    this.dataAccess = new MongoDa(connectionInfo)

    this.sync = new Sync()
  },

  _getMongoDbConnectionInfo: function () {
    return this.options.enum.mongodb[this.network]
  },

}

module.exports = Neo
