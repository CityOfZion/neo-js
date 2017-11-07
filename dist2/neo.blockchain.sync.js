const _ = require('lodash')
const async = require('async')
const EventEmitter = require('events')
const Utils = require('./neo.blockchain.utils')
const Logger = Utils.logger

/**
 * @todo Is there a way to eliminate circular reference with 'blockchain' and 'node'?
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
  this.stats = {} // For debugging purpose

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
  targetBlockIndex: 700000,
}

Sync.prototype = {
  start: function () {
    Logger.info('sync.start triggered.')
    
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
          Logger.info('blockWritePointer:', blockWritePointer)
          this._enqueueBlock(blockWritePointer + 1, true)
        }
      } else {
        clearInterval(this.clock1)
      }
    }, 2000) // TODO: configurable interval time

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
    }, 60000) // TODO: configurable interval time

    this.queue.resume()
  },

  stop: function () {
    Logger.info('sync.stop triggered.')
    this.runLock = false
    this.queue.pause()
  },

  // -- Private methods

  _initQueue: function () {
    this.queue = async.priorityQueue((task, callback) => {
      task.method(task.attrs)
        .then(() => {
          // After a sync even is run, enqueue any other outstanding blocks up to the max queue length.
          while ((queue.length() < this.maxQueueLength) && (blockWritePointer < this.targetBlockIndex)) {
            this._enqueueBlock(blockWritePointer + 1)
          }
  
          // TODO: Reintroduce debugging log
          // // Consider logging a status update...communication is important
          // if ((task.attrs.index % logPeriod === 0) ||
          //   (task.attrs.index === blockchain.highestNode().index)) {
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
          Logger.info('task.method() failed. task.attrs:', task.attrs)
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
