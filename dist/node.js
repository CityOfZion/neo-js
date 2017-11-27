/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */

const async = require('async')
const storage = require('./node/storage')
const mesh = require('./node/mesh')

/**
 * @class node
 * @description
 * A class defining a node on the neo blockchain.
 * @param {Object} options Configuration parameters for the node.
 * @example
 * neo = require('neo-js-blockchain');
 * let options = {
 *   network: 'mainnet',
 *   storage: {
 *     model: 'mongoDB',
 *     collectionNames: {
 *       blocks: 'b_neo_m_blocks',
 *       transactions: 'b_neo_m_transactions',
 *       addresses: 'b_neo_m_addresses'
 *     }
 *   }
 * }
 * const n = node(options)
 * @example
 * neo = require('neo-js-blockchain');
 * const n = node()
 * n.mesh.rpc('getBlock', 1000)
 */
class node {
  constructor (options = {}) {
    Object.assign(this, {
      network: 'testnet', /** the network to connect to. */
      domain: 'localhost', /** {String} The domain of the node */
      port: '666', /** {String} The port that the node is operating on. */
      blockRange: [0, 0], /** {Array} The range of blocks that this node is responsible for synchronizing */
      storage: 'memory', /** {String} The storage type used for this node instance, will be overwritten with actual storage object on init. */
      active: true, /** {boolean} Indicates whether the node is active. */
      latency: 0, /** {number} The nodes latency(in seconds) as reported by the last transaction. */
      blockHeight: 0, /** {number} The block height of the node. */
      index: -1, /** {number} The block index of the node calculated as this.blockHeight - 1. */
      connections: 0, /** {number} The number of connections the current node is entertaining. */
      blockWritePointer: -1, /** {number} The write pointer used to track queued & downloaded blocks. */
      maxQueueLength: 10000, /** {number} The maximum length for the queue when downloading the blockchain. */
      workerCount: 20, /** {number} The number of workers invoked to resolve tasks in the queue. */
      logPeriod: 1000, /** {number} Period at which to print a log message indicating blockchain sync status. */
      pendingRequests: 0, /** {number} Number of unresolved requests to this node. */
      unlinkedBlocks: [], /** {Array} Synchronized blocks which have not been linked to predecessors on the chain */
      assets: []
    }, options)

    this.rpc = require('./node/rpc')(this)

    // If this is a local node instance, connect to the mesh
    if (this.domain === 'localhost') {
      this.mesh = new mesh({ network: this.network })
    }

    // If mongoDB is the storage type, initialize it and start chain sync
    // and verification intervals.
    if (this.storage.model === 'mongoDB') {
      this.storage = new storage({ storage: this.storage })

      this.storage.getBlockCount()
        .then(() => {
          this.blockWritePointer = this.storage.index
          // enqueue blocks for download
          setInterval(() => {
            while ((this.blockWritePointer < this.mesh.highestNode().index) &&
            (this.queue.length() < this.maxQueueLength)) {
              this.enqueueBlock(this.blockWritePointer + 1)
            }
          }, 2000)
        })

      setInterval(() => {
        this.storage.verify()
          .then((res) => {
            console.log('Verified: missing:', res.length)
            res.forEach((r) => {
              this.enqueueBlock(r, 0)
            })
          })
      }, 180000)
    }

    this.deferredUpdateLoop()

    // Initialize an asynchronous event queue for the node to use
    this.queue = async.priorityQueue((task, callback) => {
      this[task.method](task.attrs)
        .then(() => {
          callback()
        })
        .catch((err) => {
          // If the blcok request fails, throw it to the back to the queue to try again.
          // timout prevents inf looping on connections issues etc..
          console.log(err)
          setTimeout(() => {
            this.enqueueBlock(task.attrs.index, 4)
          }, 2000)
          callback()
        })
    }, this.workerCount)
  }

  /**
   * Makes an RPC call to get the requested block
   * and inserts it into the local database.
   * @param {Object} attrs The block attributes
   */
  storeBlock (attrs) {
    return new Promise((resolve, reject) => {
      this.mesh.getBlock(attrs.index)
        .then((res) => {
          // inject the block into the database and save.
          this.storage.saveBlock(res)
            .then(() => {
              // Consider logging a status update...communication is important
              if ((attrs.index % this.logPeriod === 0) ||
              (attrs.index === this.mesh.highestNode().index)) {
                console.log(attrs)
              }
              resolve()
            })
            .catch((err) => {
              resolve(err)
            })
        })
        .catch((err) => {
          return reject(err)
        })
    })
  }

  /**
   * Adds a block request to the sync queue.
   * @param {number} index The index of the block to synchronize.
   * @param {number} [priority=5] The priority of the block download request.
   */
  enqueueBlock (index, priority = 5) {
    // if the blockheight is above the current height,
    // increment the write pointer.
    if (index > this.blockWritePointer) {
      this.blockWritePointer = index
    }
    // enqueue the block.
    this.queue.push({
      method: 'storeBlock',
      attrs: {
        index: index,
        max: this.mesh.highestNode().index || index,
        percent: (index) / (this.mesh.highestNode().index || index) * 100
      }
    }, priority)
  }

  /**
   * Runs a deferred update loop to periodically poll (with jitter)
   * the node for its block height.
   * @TODO: This needs to be revised to support all node types
   */
  deferredUpdateLoop () {
    const base = !this.active ? 10000 : 5000
    this.rpc.getBlockCount().then((res) => {
    }).catch((err) => {
    })

    setTimeout(() => this.deferredUpdateLoop(), base + Math.random() * 5000)
  }
}

module.exports = node
