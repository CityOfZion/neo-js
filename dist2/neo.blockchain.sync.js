const async = require('async')
const EventEmitter = require('events')

const Sync = function (options = {}) {
  // Properties and default values
  this.options = _.assign({}, Sync.Defaults, options)
  
  // Bootstrap
  this.eventEmitter = new EventEmitter()
  this.queue = undefined
  this.writeLock = false

  this.blockPointer = -1
}

/**
 * Default options.
 * @public
 */
Sync.Defaults = {
  workerCount: 20,
  maxQueueLength: 10000,
  startBlockIndex: 0,
  targetBlockHeight: 700000,
}

Sync.prototype = {
  start: function () {
    console.log('sync.start triggered.')

    if (!this.queue) {
      this._initQueue()
    }

    if (this.writeLock) {
      return false // prevent the overlapping runs
    }

    this.writeLock = true // Apply lock

    // (seems) iterate rough each block and pick up a new block from RPC every 2 secs
    let clock1 = setInterval(() => {
      if (this.writeLock) {
        // if ((blockchain.localNode.index < blockchain.highestNode().index) && (queue.length() === 0)) {
        if ((this.blockPointer < this.options.targetBlockHeight) && (this.queue.length() === 0)) {
          this.blockPointer = this.options.startBlockIndex
          console.log(this.blockPointer)
          this._enqueueBlock(this.blockPointer + 1, true)
        }
      } else {
        clearInterval(clock1)
      }
    }, 2000)

    // (seems) for every minute, perform a validity check on all sync'ed blocks and re'sync onces that are considered invalid
    // let clock2 = setInterval(() => {
    //   if (this.writeLock) {
    //     blockchain.localNode.verifyBlocks()
    //       .then((res) => {
    //         res.forEach((r) => {
    //           sync.enqueueBlock(r, 0)
    //         })
    //       })
    //   } else {
    //     clearInterval(clock2)
    //   }
    // }, 60000)

    this.queue.resume()
  },

  stop: function () {
    console.log('sync.stop triggered.')
    this.writeLock = false
    this.queue.pause()
  },

  // -- Private methods

  _initQueue: function () {
    this.queue = async.priorityQueue((task, callback) => {
      task.method(task.attrs)
        .then(() => {
          // after a sync even is run, enqueue any other outstanding blocks up to the max queue length.
          while ((this.queue.length() < this.options.maxQueueLength) && (this.blockPointer < this.options.targetBlockHeight)) {
            this._enqueueBlock(this.blockPointer + 1)
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
            this._enqueueBlock(task.attrs.index, 0)
          }, 2000)
          callback()
        })
    }, this.options.workerCount)
  
    this.queue.pause() // Initialize the controller with synchronization paused (so we dont sync in light mode)
  },

  /**
   * Adds a block request to the sync queue.
   * @param {number} index The index of the block to synchronize.
   * @param {number} [priority=5] The priority of the block download request.
   * @param {Boolean} [safe = false] Insert if the queue is not empty?
   */
  _enqueueBlock: function (index, priority = 5, safe = false) {
    if (safe && (queue.length() > 0)) {
      return
    }

    // if the blockheight is above the current height, increment the write pointer.
    if (index > this.blockPointer) {
      blockPointer = index
    }

    // enqueue the block.
    queue.push({
      method: this._storeBlock,
      attrs: {
        index: index,
        max: this.options.targetBlockHeight,
        percent: (index / this.options.targetBlockHeight * 100)
      }
    }, 5)
  },

  /**
   * Makes an RPC call to get the requested block
   * and inserts it into the local database.
   * @param {Object} attrs The block attributes
   */
  _storeBlock: function (attrs) {
    return new Promise((resolve, reject) => {
      // get the block using the rpc controller
      let node = blockchain.nodeWithBlock(attrs.index, 'pendingRequests', false)
      if (!stats[node.domain]) stats[node.domain] = {s: 0, f1: 0, f2: 0}

      node.getBlock(attrs.index)
        .then((res) => {
          // inject the block into the database and save.
          blockchain.localNode.saveBlock(res)
            .then(() => {
              stats[node.domain]['s']++
              resolve()
            })
            .catch((err) => {
              stats[node.domain]['f2']++
              resolve()
            })
        })
        .catch((err) => {
          stats[node.domain]['f1']++
          return reject(err)
        })
    })
  }


}

module.exports = Sync
