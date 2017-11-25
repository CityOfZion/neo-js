/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */

const storage = require('./node/storage')

/**
 * @class Node
 * @variation 1
 * @description
 * A class defining a remote node on the neo blockchain.
 * @param {Object} conf Configuration parameters for the node.
 * Ex: {'domain': 'http://seed1.neo.org', 'port': 10332}
 * @example
 * var n = node({'domain': 'http://seed1.neo.org', 'port': 10332})
 */
class node {
  constructor (options = {}) {
    Object.assign(this, {
      domain: 'localhost', /** {string} The domain of the node */
      port: '666', /** {number} The port that the node is operating on. */
      storage: 'memory',
      active: true, /** {boolean} Indicates whether the node is active. */
      latency: 0, /** {number} The nodes latency(in seconds) as reported by the last transaction. */
      blockHeight: 0, /** {number} The block height of the node. */
      index: -1, /** {number} The block index of the node calculated as this.blockHeight - 1 */
      connections: 0,
      pendingRequests: 0,
      unlinkedBlocks: [],
      assets: []
    }, options)

    if (this.storage.model === 'mongoDB') {
      this.storage = new storage({storage: this.storage})
    }

    this.rpc = require('./node/rpc')(this)
    this.deferredUpdateLoop()
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
