const EventEmitter = require('events')
const async = require('async')
const Logger = require('../common/logger')
const ValidationHelper = require('../common/validation-helper')

/**
 * @class SyncStrategy
 * @augments EventEmitter
 * @param {Mesh} mesh
 * @param {object} options
 * @param {object} options.loggerOptions
 */
class SyncStrategy extends EventEmitter {
  /**
   * @fires SyncStrategy#constructor:complete
   */
  constructor (mesh, storage, options = {}) {
    super()

    // -- Properties
    /** @type {object} */
    this.mesh = undefined
    /** @type {object} */
    this.storage = undefined
    /** @type {object} */
    this.queue = undefined
    /** @type {number} */
    this.maxQueueLength = 10000
    /** @type {number} */
    this.blockWritePointer = -1
    /** @type {object} */
    this.defaultOptions = {
      doEnqueueBlockIntervalMs: 2000,
      verifyBlocksIntervalMs: 180000,
      verifyAssetsIntervalMs: 60000,
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.mesh = mesh
    this.storage = storage
    this.logger = new Logger('SyncStrategy', this.loggerOptions)
    this.initQueue()
    this.eventHandlers()
    this.startSync()

    /**
     * @event SyncStrategy#constructor:complete
     * @type {object}
     */
    this.emit('constructor:complete')
  }

  /**
   * @private
   * @returns {void}
   */
  initQueue () {
    this.logger.debug('initQueue triggered.')

    // Initialize an asynchronous event queue for the node to use
    /**
     * @param {object} task
     * @param {string} task.method
     * @param {object} task.attrs
     * @param {number} task.attrs.index
     * @param {number} task.attrs.max
     * @param {function} callback
     * @fires SyncStrategy#async:run:complete
     */
    this.queue = async.priorityQueue((task, callback) => {
      // this.logger.debug('new worker for queue. task:', task)
      this.logger.debug('new worker for queue. task.method:', task.method)
      this[task.method](task.attrs)
        .then(() => {
          callback()
          /**
           * @event SyncStrategy#async:run:complete
           * @type {object}
           * @property {boolean} isSuccess
           * @property {object} task
           */
          this.emit('async:run:complete', { isSuccess: true, task })
        })
        .catch((err) => {
          this.logger.warn(`Task execution error. Method: [${task.method}]. Continue...`)
          this.logger.info('Error:', err)
          callback()
          /**
           * @event SyncStrategy#async:run:complete
           * @type {object}
           * @property {boolean} isSuccess
           * @property {object} task
           */
          this.emit('async:run:complete', { isSuccess: false, task })
        })
    }, this.workerCount)
  }

  /**
   * @private
   * @returns {void}
   */
  eventHandlers () {
    this.logger.debug('eventHandlers triggered.')
    this.on('async:run:complete', (payload) => {
      // this.logger.debug('async:run:complete event triggered. payload:', payload)
      if (!payload.isSuccess) {
        this.logger.debug('async:run:complete unsuccessful event triggered. payload:', payload)
        if (payload.task.method === 'storeBlock') {
          // If the block request fails, throw it to the back to the queue to try again.
          // setTimeout is to prevent infinite looping on connections issues etc..
          setTimeout(() => {
            this.enqueueBlock(payload.task.attrs.index, 4)
          }, 2000)
        }
      }
    })
  }

  /**
   * @private
   * @returns {void}
   */
  startSync () {
    this.logger.debug('startSync triggered.')
    this.initEnqueueBlock()
    this.initBlockVerification()
    this.initAssetVerification()
  }

  /**
   * @private
   * @returns {void}
   */
  initEnqueueBlock () {
    this.logger.debug('initEnqueueBlock triggered.')
    this.storage.getBlockCount()
      .then(() => {
        this.blockWritePointer = this.storage.index
        // enqueue blocks for download
        setInterval(() => {
          this.doEnqueueBlock()
        }, this.doEnqueueBlockIntervalMs)
      })
  }

  /**
   * @private
   * @returns {void}
   */
  initBlockVerification () {
    this.logger.debug('initBlockVerification triggered.')
    setInterval(() => {
      this.storage.verifyBlocks()
        .then((res) => {
          this.logger.info('Blocks verified. missing:', res.length)
          res.forEach((blockIndex) => {
            this.enqueueBlock(blockIndex, 0)
          })
        })
    }, this.verifyBlocksIntervalMs)
  }

  /**
   * @private
   * @returns {void}
   */
  initAssetVerification () {
    this.logger.debug('initAssetVerification triggered.')
    setInterval(() => {
      // check for asset state
      this.storage.verifyAssets()
        .then((res) => {
          this.logger.info('Assets verified. missing states:', res.length)
          res.forEach((assetHash) => {
            this.enqueueAsset(assetHash, 0)
          })
        })
    }, this.verifyAssetsIntervalMs)
  }

  /**
   * @private
   * @returns {void}
   */
  doEnqueueBlock () {
    this.logger.debug('doEnqueueBlock triggered.')
    const node = this.mesh.getHighestNode()
    if (ValidationHelper.isValidNode(node)) {
      while ((this.blockWritePointer < node.index) && (this.queue.length() < this.maxQueueLength)) {
        this.enqueueBlock(this.blockWritePointer + 1)
      }
    } else {
      // Error
      this.logger.error('Unable to find a valid node.')
      // throw new Error('Unable to find a valid node.')
    }
  }

  /**
   * @private
   * @param {number} index
   * @param {priority} priority
   * @returns {void}
   * @fires SyncStrategy#enqueueBlock:init
   */
  enqueueBlock (index, priority = 5) {
    this.logger.debug('enqueueBlock triggered. index:', index, 'priority:', priority)
    /**
     * @event SyncStrategy#enqueueBlock:init
     * @type {object}
     * @property {number} index
     * @property {priority} priority
     */
    this.emit('enqueueBlock:init', { index, priority })
    // if the block height is above the current height, increment the write pointer.
    if (index > this.blockWritePointer) {
      this.blockWritePointer = index
    }

    const node = this.mesh.getHighestNode() // TODO: validate
    const max = node.index || index

    // enqueue the block
    this.queue.push({
      method: 'storeBlock',
      attrs: {
        index: index,
        max: max
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
    this.logger.debug('enqueueAsset triggered. hash:', hash, 'priority:', priority)
    this.queue.push({
      method: 'storeAsset',
      attrs: {
        hash
      }
    }, priority)
  }

  /**
   * @private
   * @param {object} attrs
   * @param {number} attrs.index
   * @param {number} attrs.max
   * @returns {void}
   * @fires SyncStrategy#storeBlock:init
   * @fires SyncStrategy#storeBlock:complete
   */
  storeBlock (attrs) {
    this.logger.debug('storeBlock triggered. attrs:', attrs)
    /**
     * @event SyncStrategy#storeBlock:init
     * @type {object}
     * @property {number} index
     */
    this.emit('storeBlock:init', { index: attrs.index })
    return new Promise((resolve, reject) => {
      // const targetNode = this.mesh.getNodeWithBlock(attrs.index)
      // targetNode.rpc.getBlock(attrs.index)
      this.mesh.rpc('getBlock', attrs.index)
        .then((res) => {
          // inject the block into the database and save.
          this.storage.saveBlock(res)
            .then(() => {
              // // TODO: move below out to be reactive
              // // Consider logging a status update... communication is important
              // if ((attrs.index % this.logPeriod === 0) || (attrs.index === this.mesh.getHighestNode().index)) {
              //   this.logger.info(attrs)
              // }
              /**
               * @event SyncStrategy#storeBlock:complete
               * @type {object}
               * @property {number} index
               * @property {number} max
               * @property {boolean} isSuccess
               */
              this.emit('storeBlock:complete', { index: attrs.index, max: attrs.max, isSuccess: true })
              resolve()
            })
            .catch((err) => {
              /**
               * @event SyncStrategy#storeBlock:complete
               * @type {object}
               * @property {number} index
               * @property {number} max
               * @property {boolean} isSuccess
               */
              this.emit('storeBlock:complete', { index: attrs.index, max: attrs.max, isSuccess: false })
              resolve(err)
            })
        })
        .catch((err) => {
          /**
           * @event SyncStrategy#storeBlock:complete
           * @type {object}
           * @property {number} index
           * @property {number} max
           * @property {boolean} isSuccess
           */
          this.emit('storeBlock:complete', { index: attrs.index, max: attrs.max, isSuccess: false })
          reject(err)
        })
    })
  }

  /**
   * @private
   * @param {object} attrs
   * @param {string} attr.hash
   * @returns {void}
   * @fires SyncStrategy#storeAsset:init
   * @fires SyncStrategy#storeAsset:complete
   */
  storeAsset (attrs) {
    this.logger.debug('storeAsset triggered. attrs:', attrs)
    /**
     * @event SyncStrategy#storeAsset:int
     * @type {object}
     * @property {string} hash
     */
    this.emit('storeAsset:init', { hash: attrs.hash })
    return new Promise((resolve, reject) => {
      this.mesh.rpc('getAssetState', attrs.hash)
        .then((res) => {
          this.storage.saveAssetState(attrs.hash, res)
            .then((res) => {
              /**
               * @event SyncStrategy#storeAsset:complete
               * @type {object}
               * @property {string} hash
               * @property {boolean} isSuccess
               */
              this.emit('storeAsset:complete', { hash: attrs.hash, isSuccess: true })
              resolve(res)
            })
            .catch((err) => {
              /**
               * @event SyncStrategy#storeAsset:complete
               * @type {object}
               * @property {string} hash
               * @property {boolean} isSuccess
               */
              this.emit('storeAsset:complete', { hash: attrs.hash, isSuccess: false })
              reject(err)
            })
        })
        .catch((err) => {
          /**
           * @event SyncStrategy#storeAsset:complete
           * @type {object}
           * @property {string} hash
           * @property {boolean} isSuccess
           */
          this.emit('storeAsset:complete', { hash: attrs.hash, isSuccess: false })
          reject(err)
        })
    })
  }
}

module.exports = SyncStrategy
