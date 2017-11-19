/* eslint handle-callback-err: "off" */
/**
 *
 * The synchronization functionality for the neo blockchain.
 * This code is only executed when running a neo instance in 'full' mode.
 * @class
 * @requires lodash
 * @requires async
 * @param {neo} blockchain A reference to the parent blockchain instance.
 * @example
 * let neoBlockchain = neo('full', 'testnet')
 * neoBlockchain.sync.start()
 */
function sync (blockchain) {
  const sync = this
  const async = require('async')
  /** {boolean} runLock An attribute used to garantee only a single synchronization activity. */
  sync.runLock = false
  /** {number} blockWritePointer The sync horizon representing the heighest block index
   * which has either been commited to the database or is queue for commit.
   */
  let blockWritePointer = -1
  /** {number} defaultWorkerCount The default number of workers to synchronize the blockchain with. */
  let defaultWorkerCount = 20
  /* {number} maxQueueLength The number of blocks to keep in queue. Exists to reduce memory use. */
  let maxQueueLength = 10000
  /* {number} logPeriod Prints a status update every 'n' blocks. */
  let logPeriod = 10000

  let stats = {}
  let t0 = Date.now()

  /**
   * Maintains the synchronization queue for the blockchain.
   * @private
   * @param {Object} task the task to be executed in the queue.
   * @param {function} callback
   * @example {'method': function, 'attrs': object}
   * @returns {Lyfe}
   */
  let queue = async.priorityQueue((task, callback) => {
    task.method(task.attrs)
      .then(() => {
        // after a sync even is run, enqueue any other
        // outstanding blocks up to the max queue length.
        while ((queue.length() < maxQueueLength) &&
        (blockWritePointer < blockchain.highestNode().index)) {
          sync.enqueueBlock(blockWritePointer + 1)
        }

        // Consider logging a status update...communication is important
        if ((task.attrs.index % logPeriod === 0) ||
          (task.attrs.index === blockchain.highestNode().index)) {
          console.log(task.attrs, logPeriod / ((Date.now() - t0) / 1000))
          if ((task.attrs.index === blockchain.highestNode().index)) {
            console.log(stats)
          }

          t0 = Date.now()
        }

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
  }, defaultWorkerCount)

  queue.pause() // Initialize the controller with synchronization paused (so we dont sync in light mode)

  /** Starts the synchronization activity. */
  this.start = () => {
    if (sync.runLock) return false // prevent the overlapping runs
    sync.runLock = true

    console.log('Synchronizing')
    sync.clock = setInterval(() => {
      if (sync.runLock) {
        if ((blockchain.localNode.index < blockchain.highestNode().index) &&
          (queue.length() === 0)) {
          blockWritePointer = blockchain.localNode.index
          console.log(blockWritePointer)
          sync.enqueueBlock(blockWritePointer + 1, true)
        }
      } else {
        clearInterval(sync.clock)
      }
    }, 2000)

    sync.clock2 = setInterval(() => {
      if (sync.runLock) {
        blockchain.localNode.verifyBlocks()
          .then((res) => {
            res.forEach((r) => {
              sync.enqueueBlock(r, 0)
            })
          })
      } else {
        clearInterval(sync.clock)
      }
    }, 60000)

    queue.resume()
  }

  /** Stops the synchronization activity. */
  this.stop = () => {
    sync.runLock = false
    queue.pause()
  }

  /**
   * Update the number of workers in the sync activity.
   * @param {number} count The number of workers to use.
   */
  this.setWorkers = (count) => {
    queue.concurrency = count
  }

  /**
   * Makes an RPC call to get the requested block
   * and inserts it into the local database.
   * @param {Object} attrs The block attributes
   */
  this.storeBlock = (attrs) => {
    return new Promise((resolve, reject) => {
      // get the block using the rpc controller
      let node = blockchain.nodeWithBlock(attrs.index, 'pendingRequests', false)
      if (!stats[node.domain]) stats[node.domain] = {s: 0, f1: 0, f2: 0}

      node.rpc.getBlock(attrs.index)
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

  /**
   * Adds a block request to the sync queue.
   * @param {number} index The index of the block to synchronize.
   * @param {number} [priority=5] The priority of the block download request.
   * @param {Boolean} [safe = false] Insert if the queue is not empty?
   */
  this.enqueueBlock = (index, priority = 5, safe = false) => {
    if (safe && (queue.length() > 0)) return
    // if the blockheight is above the current height,
    // increment the write pointer.
    if (index > blockWritePointer) {
      blockWritePointer = index
    }
    // enqueue the block.
    queue.push({
      method: sync.storeBlock,
      attrs: {
        index: index,
        max: blockchain.highestNode().index,
        percent: (index) / blockchain.highestNode().index * 100
      }
    }, 5)
  }
}

exports.sync = sync
