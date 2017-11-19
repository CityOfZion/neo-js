/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
module.exports = function (network) {
  const module = {
    nodes: []
  }


  // Neo Council Seeds
  const neoSeeds = [
    'http://seed1.neo.org',
    'http://seed2.neo.org',
    'http://seed3.neo.org',
    'http://seed4.neo.org',
    'http://seed5.neo.org',
    'http://seed8.antshares.org',
    'http://api.otcgo.cn'
  ]
  let neoPort = 20332
  let cozPort = 8880
  let cozNetwork = 'test'

  if (network === 'mainnet') {
    neoPort = 10332
    cozPort = 8080
    cozNetwork = 'seed'
  }

  // build the list of neo-maintained nodes
  neoSeeds.forEach((domain) => {
    module.nodes.push(new node({
      domain,
      port: neoPort
    }))
  })

  // build the list of CoZ maintained nodes
  const cozNodes = [1, 2, 3, 4, 5]
  cozNodes.forEach((i) => {
    module.nodes.push(new node({
      domain: `http://${cozNetwork}${i}.cityofzion.io`,
      port: cozPort
    }))
  })

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
  function node (conf) {
    /** {string} The domain of the node */
    /** {number} The port that the node is operating on. */
    /** {number} The last query date represented as seconds since the epoch. */
    /** {boolean} Indicates where the node is active. */
    /** {number} The nodes latency(in seconds) as reported by the last transaction. */
    /** {number} The block height of the node. */
    /** {number} The block index of the node calculated as this.blockHeight - 1 */
    Object.assign(this, {
      domain: conf.domain,
      port: conf.port,
      age: 0,
      active: true,
      latency: 0,
      blockHeight: 0,
      index: -1,
      connections: 0,
      pendingRequests: 0
    })
    const node = this

    this.rpc = require('./node/util/rpc')(this)

    /**
     * Runs a deferred update loop to periodically poll (with jitter)
     * the node for its block height.
     */
    this.deferredUpdateLoop = () => {
      const base = !node.active ? 10000 : 5000
      this.rpc.getBlockCount().then((res) => {
      }).catch((err) => {
      })

      setTimeout(node.deferredUpdateLoop, base + Math.random() * 5000)
    }

    this.deferredUpdateLoop()
  }

  return module
}
