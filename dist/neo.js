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
 */
class Neo {
  constructor (options = {}) {
    // -- Properties
    this.mesh = undefined
    this.wallet = undefined
    this.storage = undefined
    this.queue = undefined
    this.maxQueueLength = 10000
    this.blockWritePointer = -1
    this.defaultOptions = {
      workerCount: 20,
      network: undefined,
      storageMeta: undefined,
      logger: new Logger('Neo')
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.initMesh()
    this.initStorage()
    this.initWallet()
    this.initBackgroundTasks()
  }

  /**
   * @access private
   * @returns {void}
   */
  initMesh () {
    /**
     * check for its network, create nodes accordingly
     */
    const nodes = this.getNodes()

    /**
     * mesh essentially baby sits all nodes, exclude local node.
     * Assume all nodes will have access to RPC
     * it should be THIS's job to supply the nodes.
     */
    this.mesh = new Mesh(nodes)
  }

  /**
   * @access private
   * @returns Array<Node>
   */
  getNodes () {
    /**
     * previously, mesh was doing this.
     * we now move the responsibility to THIS.
     */

    let nodes = []
    let endpoints = []

    // TODO: verify network
    // fetch endpoint infos base on network type
    if (this.network === 'mainnet') {
      endpoints = profiles.rpc.mainnet.endpoints
    } else if (this.network === 'testnet') {
      endpoints = profiles.rpc.testnet.endpoints
    } else {
      endpoints = this.network.endpoints
    }
    // TODO: verify result endpoints
    this.logger.debug('endpoints:', endpoints)

    endpoints.forEach((endpoint) => {
      nodes.push(new Node({
        domain: endpoint.domain,
        port: endpoint.port
      }))
    })

    return nodes
  }

  /**
   * @access private
   * @returns {void}
   */
  initStorage () {
    /**
     * check for storage solution, create local node accordingly.
     * we only support 1 local node atm.
     */
    if (this.storageMeta) {
      if (this.storageMeta.model === 'mongoDB') {
        this.storage = new Storage({ storageMeta: this.storageMeta })
        this.initEnqueueBlock()
        this.initBlockVerification()
        this.initAssetVerification()
      } else {
        // TODO: so you want to enable local node but did not provide a valid storage model?
      }
    } else {
      // TODO: what happens when local node is unwanted?
    }
  }

  /**
   * @access private
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
   * @access private
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
   * @access private
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
   * @access private
   * @returns {void}
   */
  initWallet () {
    this.wallet = new Wallet({ network: this.network })
  }

  /**
   * @access private
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
    setInterval(() => {
      this.pingRandomNode()
    }, 2000)

    // Initialize an asynchronous event queue for the node to use
    this.queue = async.priorityQueue((task, callback) => {
      this.logger.debug('new worker for queue. task:', task)
      this[task.method](task.attrs)
        .then(() => {
          callback()
        })
        .catch((err) => {
          // If the block request fails, throw it to the back to the queue to try again.
          // timeout prevents inf looping on connections issues etc..
          this.logger.error(err)

          // TODO: need to have the reactive, oppose to hardcode enqueueBlock retry after 2 seconds
          setTimeout(() => {
            this.enqueueBlock(task.attrs.index, 4)
          }, 2000)

          callback()
        })
    }, this.workerCount)
  }

  /**
   * @access private
   * @returns {void}
   */
  pingRandomNode () {
    this.logger.debug('pingRandomNode triggered.')
    const targetNode = this.mesh.getRandomNode()
    this.pingNode(targetNode)
  }

  /**
   * @access private
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
   * @access private
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
   * @access private
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
   * @access private
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
   * @access private
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