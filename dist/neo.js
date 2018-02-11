/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
const async = require('async')
const Storage = require('./node/storage')
const Mesh = require('./node/mesh')
const Wallet = require('./wallet')
const Logger = require('./common/logger')
const profiles = require('./common/profiles')
const Node = require('./node/node')

/**
 * @class Neo
 * @param {Object} options
 * @param {number} options.workerCount
 * @param {string} options.network
 * @param {Object} options.logger
 * @param {Object} options.meshOptions
 * @param {Object} options.nodeOptions
 * @param {Object} options.storageOptions
 * @param {Object} options.walletOptions
 * @param {object} options.loggerOptions
 */
class Neo {
  constructor (options = {}) {
    // -- Properties
    /** @type {Object} */
    this.mesh = undefined
    /** @type {Object} */
    this.wallet = undefined
    /** @type {Object} */
    this.storage = undefined
    /** @type {Object} */
    this.queue = undefined
    /** @type {number} */
    this.maxQueueLength = 10000
    /** @type {number} */
    this.blockWritePointer = -1
    /** @type {Object} */
    this.defaultOptions = {
      workerCount: 20,
      network: undefined,
      logger: undefined,
      meshOptions: {},
      nodeOptions: {},
      storageOptions: {},
      walletOptions: {},
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.initLogger()
    this.initMesh()
    this.initStorage()
    this.initWallet()
    this.initBackgroundTasks()
  }

  /**
   * @private
   * @returns {void}
   */
  initLogger () {
    this.logger = new Logger('Neo', this.loggerOptions)
  }

  /**
   * @private
   * @returns {void}
   */
  initMesh () {
    const nodes = this.getNodes()
    this.mesh = new Mesh(nodes, this.meshOptions)
  }

  /**
   * @private
   * @returns Array.<Node>
   */
  getNodes () {
    let nodes = []
    let endpoints = []

    // TODO: validate network
    // fetch endpoint infos base on network type
    if (this.network === 'mainnet') {
      endpoints = profiles.rpc.mainnet.endpoints
    } else if (this.network === 'testnet') {
      endpoints = profiles.rpc.testnet.endpoints
    } else {
      endpoints = this.network.endpoints
    }
    // TODO: validate result endpoints
    this.logger.debug('endpoints:', endpoints)

    endpoints.forEach((endpoint) => {
      const options = Object.assign(this.nodeOptions, { domain: endpoint.domain, port: endpoint.port })
      nodes.push(new Node(options))
    })

    return nodes
  }

  /**
   * @private
   * @returns {void}
   */
  initStorage () {
    if (this.storageOptions) {
      this.storage = new Storage(this.storageOptions)
      if (this.storage.model === 'mongoDB') {
        this.initEnqueueBlock()
        this.initBlockVerification()
        this.initAssetVerification()
      } else {
        this.logger.error('Unsupported storage model:', this.storage.model)
      }
    } else {
      this.logger.error('Invalid storageOptions variable.')
    }
  }

  /**
   * @private
   * @returns {void}
   */
  initEnqueueBlock () {
    this.storage.getBlockCount()
      .then(() => {
        this.blockWritePointer = this.storage.index
        // enqueue blocks for download
        setInterval(() => {
          while ((this.blockWritePointer < this.mesh.getHighestNode().index) && (this.queue.length() < this.maxQueueLength)) {
            this.enqueueBlock(this.blockWritePointer + 1)
          }
        }, 2000)
      })
  }

  /**
   * @private
   * @returns {void}
   */
  initBlockVerification () {
    setInterval(() => {
      this.storage.verifyBlocks()
        .then((res) => {
          this.logger.info('Blocks verified. missing:', res.length)
          res.forEach((blockIndex) => {
            this.enqueueBlock(blockIndex, 0)
          })
        })
    }, 180000)
  }

  /**
   * @private
   * @returns {void}
   */
  initAssetVerification () {
    setInterval(() => {
      // check for asset state
      this.storage.verifyAssets()
        .then((res) => {
          this.logger.info('Assets verified. missing states:', res.length)
          res.forEach((assetHash) => {
            this.enqueueAsset(assetHash, 0)
          })
        })
    }, 60000)
  }

  /**
   * @private
   * @returns {void}
   */
  initWallet () {
    const options = Object.assign(this.walletOptions, { network: this.network })
    this.wallet = new Wallet(options)
  }

  /**
   * @private
   * @returns {void}
   */
  initBackgroundTasks () {
    /**
     * This is where you line up your schedule tickers to do all sort of tasks.
     */

    // Ping all nodes in order to setup their height and latency
    this.mesh.nodes.forEach((node) => {
      this.pingNode(node)
    })

    // Ping a random node periodically
    // TODO: apply some sort of priority to ping inactive node less frequent
    setInterval(() => {
      this.pingRandomNode()
    }, 2000)

    // Initialize an asynchronous event queue for the node to use
    /**
     * @param {Object} task
     * @param {string} task.method
     * @param {Object} task.attrs
     * @param {number} task.attrs.index
     * @param {number} task.attrs.max
     * @param {number} task.attrs.percent
     * @param {function} callback
     */
    this.queue = async.priorityQueue((task, callback) => {
      this.logger.debug('new worker for queue. task:', task)
      this[task.method](task.attrs)
        .then(() => {
          callback()
        })
        .catch((err) => {
          // If the block request fails, throw it to the back to the queue to try again.
          // timeout prevents inf looping on connections issues etc..
          this.logger.warn(`Task execution error. Method: [${task.method}]. Continue...`)
          this.logger.info('Error:', err)

          // TODO: need to have the reactive, oppose to hardcode enqueueBlock retry after 2 seconds
          setTimeout(() => {
            this.enqueueBlock(task.attrs.index, 4)
          }, 2000)

          callback()
        })
    }, this.workerCount)
  }

  /**
   * @private
   * @returns {void}
   */
  pingRandomNode () {
    this.logger.debug('pingRandomNode triggered.')
    const targetNode = this.mesh.getRandomNode()
    this.pingNode(targetNode)
  }

  /**
   * @private
   * @returns {void}
   */
  pingNode (node) {
    this.logger.debug('pingNode triggered.', `node: [${node.domain}:${node.port}]`)

    const t0 = Date.now()
    node.pendingRequests += 1
    node.rpc.getBlockCount()
      .then((res) => {
        this.logger.debug('getBlockCount success:', res)
        const blockCount = res
        node.blockHeight = blockCount
        node.index = blockCount - 1
        node.active = true
        node.age = Date.now()
        node.latency = node.age - t0
        node.pendingRequests -= 1
        this.logger.debug('node.latency:', node.latency)
      })
      .catch((err) => {
        this.logger.debug('getBlockCount failed. move on.')
        node.active = false
        node.age = Date.now()
        node.pendingRequests -= 1
      })
  }

  /**
   * @private
   * @param {Object} attrs
   * @param {number} attrs.index
   * @param {number} attrs.max
   * @param {number} attrs.percent
   * @returns {void}
   */
  storeBlock (attrs) {
    this.logger.debug('storeBlock triggered. attrs:', attrs)
    return new Promise((resolve, reject) => {
      // const targetNode = this.mesh.getNodeWithBlock(attrs.index)
      // targetNode.rpc.getBlock(attrs.index)
      this.mesh.rpc('getBlock', attrs.index)
        .then((res) => {
          // inject the block into the database and save.
          this.storage.saveBlock(res)
            .then(() => {
              // TODO: move below out to be reactive
              // Consider logging a status update... communication is important
              if ((attrs.index % this.logPeriod === 0) || (attrs.index === this.mesh.getHighestNode().index)) {
                this.logger.info(attrs)
              }
              resolve()
            })
            .catch((err) => {
              resolve(err)
            })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /**
   * @private
   * @param {Object} attrs
   * @param {string} attr.hash
   * @returns {void}
   */
  storeAsset (attrs) {
    return new Promise((resolve, reject) => {
      this.mesh.rpc('getAssetState', attrs.hash)
        .then((res) => {
          this.storage.saveAssetState(attrs.hash, res)
            .then((res) => {
              resolve(res)
            })
            .catch((err) => reject(err))
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /**
   * @private
   * @param {number} index
   * @param {priority} priority
   * @returns {void}
   */
  enqueueBlock (index, priority = 5) {
    // if the block height is above the current height,
    // increment the write pointer.
    if (index > this.blockWritePointer) {
      this.blockWritePointer = index
    }
    // enqueue the block.
    this.queue.push({
      method: 'storeBlock',
      attrs: {
        index: index,
        max: this.mesh.getHighestNode().index || index,
        percent: (index) / (this.mesh.getHighestNode().index || index) * 100
      }
    }, priority)
  }

  /**
   * @private
   * @param {string} hash
   * @param {number} priority
   * @returns {void}
   */
  enqueueAsset (hash, priority = 5) {
    this.queue.push({
      method: 'storeAsset',
      attrs: {
        hash
      }
    }, priority)
  }
}

module.exports = Neo
