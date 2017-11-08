/* eslint handle-callback-err: "off" */
const _ = require('lodash')
const async = require('async')
const Utils = require('./neo.blockchain.utils')
const Logger = Utils.logger

/**
 * @todo Is there a way to eliminate circular reference with 'blockchain' and 'node'?
 * @todo Better way to manage deubbing variables
 * @param {Object} blockchain 
 * @param {Object} node 
 * @param {Object} options 
 */
const Sync = function (blockchain, localNode, options = {}) {
  // Properties and default values
  this.blockchain = blockchain
  this.localNode = localNode
  this.options = _.assign({}, Sync.Defaults, options)
  this.queue = undefined
  this.runLock = false
  this.blockWritePointer = -1
  // For debugging purpose
  this.stats = {}
  this.logPeriod = 10000
  this.t0 = Date.now()

  // Bootstrap
  Logger.setLevel(this.options.verboseLevel)
}

/**
 * Default options.
 * @public
 */
Sync.Defaults = {
  eventEmitter: undefined,
  verboseLevel: 2,
  workerCount: 20,
  maxQueueLength: 10000,
  startBlockIndex: 0,
  targetBlockIndex: 700000
}

Sync.prototype = {
  /**
   * @todo Verify if the implementation is working
   * @todo configuration interval values
   */
  start: function () {
    Logger.info('[sync] start() triggered.')

    if (!this.queue) {
      this._initQueue()
    }

    if (this.runLock) {
      return false // prevent the overlapping runs
    }

    this.runLock = true // Apply lock

    Logger.info('Synchronizing...')
    this.clock1 = setInterval(() => {
      if (this.runLock) {
        if ((this.localNode.index < this.targetBlockIndex) && (this.queue.length() === 0)) {
          this.blockWritePointer = this.localNode.index
          Logger.info('blockWritePointer:', this.blockWritePointer)
          this._enqueueBlock(this.blockWritePointer + 1, true)
        }
      } else {
        clearInterval(this.clock1)
      }
    }, 2000)

    this.clock2 = setInterval(() => {
      if (this.runLock) {
        this.localNode.verifyBlocks()
          .then((res) => {
            res.forEach((r) => {
              this._enqueueBlock(r, 0)
            })
          })
      } else {
        clearInterval(this.clock2)
      }
    }, 60000)

    this.queue.resume()
  },

  /**
   * @todo Verify if the implementation is working
   */
  stop: function () {
    Logger.info('[sync] stop() triggered.')
    this.runLock = false
    this.queue.pause()
  },

  /**
   * @todo Verify if the implementation is working
   */
  setTargetBlockIndex: function (index) {
    this.options.targetBlockIndex = index
  },

  // -- Private methods

  /**
   * @todo Verify if the implementation is working
   * @private
   */
  _initQueue: function () {
    Logger.info('[sync] _initQueue() triggered.')
    this.queue = async.priorityQueue((task, callback) => {
      task.method(task.attrs)
        .then(() => {
          Logger.info('task.method() succeed! task.attrs:', task.attrs)
          
          // After a sync even is run, enqueue any other outstanding blocks up to the max queue length.
          while ((this.queue.length() < this.maxQueueLength) && (this.blockWritePointer < this.targetBlockIndex)) {
            this._enqueueBlock(this.blockWritePointer + 1)
          }

          // Consider logging a status update... communication is important
          if ((task.attrs.index % this.logPeriod === 0) || (task.attrs.index === this.targetBlockIndex)) {
            Logger.info(task.attrs, (this.logPeriod / ((Date.now() - this.t0) / 1000)))
            if ((task.attrs.index === this.targetBlockIndex)) {
              Logger.info('stats:', this.stats)
            }
            this.t0 = Date.now()
          }

          callback()
        })
        .catch((err) => {
          // If the blcok request fails, throw it to the back to the queue to try again.
          // timout prevents inf looping on connections issues etc..
          Logger.info('task.method() failed, try again later... task.attrs:', task.attrs)
          setTimeout(() => {
            this._enqueueBlock(task.attrs.index, 0)
          }, 2000) // TODO: configurable interval time
          callback()
        })
    }, this.workerCount)

    this.queue.pause() // Initialize the controller with synchronization paused (so we dont sync in light mode)
  },

  /**
   * Adds a block request to the sync queue.
   * @todo Verify if the implementation is working
   * @private
   * @param {number} index The index of the block to synchronize.
   * @param {number} [priority=5] The priority of the block download request.
   * @param {Boolean} [safe=false] Insert if the queue is not empty?
   */
  _enqueueBlock: function (index, priority = 5, safe = false) {
    if (safe && (this.queue.length() > 0)) {
      return
    }

    // If the blockheight is above the current height, increment the write pointer.
    if (index > this.blockWritePointer) {
      this.blockWritePointer = index
    }

    // Enqueue the block.
    this.queue.push({
      method: this._storeBlock,
      attrs: {
        index: index,
        max: this.targetBlockIndex,
        percent: (index / this.targetBlockIndex * 100)
      }
    }, 5) // TODO: Configurable priority value
  },

  /**
   * Makes an RPC call to get the requested block and inserts it into the local database.
   * @todo Verify if the implementation is working
   * @private
   * @param {Object} attrs The block attributes
   */
  _storeBlock: function (attrs) {
    return new Promise((resolve, reject) => {
      // Get the block using the rpc controller
      const node = this.blockchain.getNodeWithBlock(attrs.index, 'pendingRequests', false)

      // Setup stats report
      if (!this.stats[node.api.url]) {
        this.stats[node.api.url] = { s: 0, f1: 0, f2: 0 } // 's' for Success count, 'f1' for getBlock Fail count, 'f2' for saveBlock Fail count.
      }

      // Fetch
      node.api.getBlock(attrs.index)
        .then((res) => {
          // Save to local node
          this.localNode.api.saveBlock(res)
            .then(() => {
              this.stats[node.api.url]['s']++
              resolve()
            })
            .catch((err) => {
              this.stats[node.api.url]['f2']++
              resolve()
            })
        })
        .catch((err) => {
          this.stats[node.api.url]['f1']++
          reject(err)
        })
    })
  }
}

module.exports = Sync
