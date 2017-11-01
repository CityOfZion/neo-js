const async = require('async')

const Sync = function (options = {}) {
  // Properties and default values
  this.options = _.assign({}, Sync.Defaults, options)
  
  // Bootstrap
  this.syncQueue = undefined
  this.syncLock = false

  this.syncBlockPointer = -1
  this.syncWorkerCount = 20
  this.syncMaxQueueLength = 10000
  // this.syncStartTime = undefined
}

/**
 * Default options.
 * @public
 */
Sync.Defaults = {
}

Sync.prototype = {
  start: function () {
    console.log('sync.start triggered.')

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

  stop: function () {
    console.log('sync.stop triggered.')

    this.syncLock = false
    this.syncQueue.pause()
  },

  // -- Private methods

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

module.exports = Sync
