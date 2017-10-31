const _ = require('lodash')
const mongoose = require('mongoose')
const async = require('async')
const EventEmitter = require('events')
const Rpc = require('./neo.blockchain.rpc')
const MongoDa = require('./neo.blockchain.data.mongodb')

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
  this.dataAccess = undefined
  // TODO: have some worker in the background that keep pining getBlockCount in order to fetch height and speed info. Make this a feature toggle
  // TODO: cache mechanism, in-memory, vs mongodb?
  // TODO: auto (re)pick 'an appropriate' node

  this.syncQueue = undefined
  this.syncLock = false

  this.syncBlockPointer = -1
  this.syncWorkerCount = 20
  this.syncMaxQueueLength = 10000
  // this.syncStartTime = undefined







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

  // -- Sync Methods

  startSync: function () {
    if (!this.syncQueue) {
      this._initSyncQueue()
    }

    if (this.syncLock) {
      return false // prevent the overlapping runs
    }

    this.syncLock = true // Apply lock

    // (seems) iterate rough each block and pick up a new block from RPC every 2 secs
    let clock1 = setInterval(() => {
      if (this.syncLock) {
        // if ((blockchain.localNode.index < blockchain.highestNode().index) && (queue.length() === 0)) {
        if ((this.syncBlockPointer < this.getHighestNode().height) && (this.syncQueue.length() === 0)) {
          // this.syncBlockPointer = 
          blockWritePointer = blockchain.localNode.index
          console.log(blockWritePointer)
          sync.enqueueBlock(blockWritePointer + 1, true)
        }
      } else {
        clearInterval(clock1)
      }
    }, 2000)

    // (seems) for every minute, perform a validity check on all sync'ed blocks and re'sync onces that are considered invalid
    let clock2 = setInterval(() => {
      if (this.syncLock) {
        blockchain.localNode.verifyBlocks()
          .then((res) => {
            res.forEach((r) => {
              sync.enqueueBlock(r, 0)
            })
          })
      } else {
        clearInterval(clock2)
      }
    }, 60000)

    queue.resume()
  },

  stopSync: function () {
    this.syncLock = false
    queue.pause()
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
    if (this.dataAccess) {
      if (this.verboseLevel >= 3) {
        console.log('fetching getBlock from DB...')
      }
      const block = this.dataAccess.getBlock(index)
      if(block) { // TODO: formal block validation util
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
    this.dataAccess = new MongoDa(connectionInfo)
  },

  _getMongoDbConnectionInfo: function () {
    return this.options.enum.mongodb[this.network]
  },

  _initSyncQueue: function () {
    this.syncQueue = async.priorityQueue((task, callback) => {
      task.method(task.attrs)
        .then(() => {
          // after a sync even is run, enqueue any other outstanding blocks up to the max queue length.
          while ((this.syncQueue.length() < this.syncMaxQueueLength) && (this.syncBlockPointer < this.getHighestNode().height)) {
            sync.enqueueBlock(this.syncBlockPointer + 1)
          }
  
          // // Consider logging a status update...communication is important
          // if ((task.attrs.index % logPeriod === 0) || (task.attrs.index === blockchain.highestNode().index)) {
          //   console.log(task.attrs, logPeriod / ((Date.now() - t0) / 1000))
          //   if ((task.attrs.index === blockchain.highestNode().index)) {
          //     console.log(stats)
          //   }
  
          //   t0 = Date.now()
          // }
  
          callback()
        })
        .catch((err) => {

          // If the blcok request fails, throw it to the back to the queue to try again.
          // timout prevents inf looping on connections issues etc..
          console.log(task.attrs, 'fail')
          setTimeout(() => {
            sync.enqueueBlock(task.attrs.index, 0)
          }, 2000)
          callback()
        })
    }, this.syncWorkerCount)
  
    this.syncQueue.pause() // Initialize the controller with synchronization paused (so we dont sync in light mode)
  },

}

module.exports = Neo
