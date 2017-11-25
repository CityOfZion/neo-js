/* eslint new-cap: "off" */
/**
 * An instance of the neo blockchain
 * @class
 * @requires lodash
 * @requires node
 * @requires neo.blockchain.sync
 * @param {string} mode Sets whether the library should run in full or light mode.
 * @param {string} network Indicates which network to operate the instance on.
 * @example
 * neo = require('neo-js-blockchain');
 * var blockchainNeo = new neo('full', 'testnet'); // Creates a new full node instance on testnet.
 * @example
 * neo = require('neo-js-blockchain');
 * var neoBlockchain = new neo('light', 'mainnet') // Creates a new light node instances on mainnet.
 */
function neo (mode, network) {
  const _ = require('lodash')
  const sync = require('./neo.blockchain.sync')
  const node = require('./node')

  Object.assign(this, {
    mode,
    network,
    nodes: [],
    sync: new sync(this)
  })

  // Neo Council Seeds
  const neoSeeds = [
    'http://seed1.neo.org',
    'http://seed2.neo.org',
    'http://seed3.neo.org',
    'http://seed4.neo.org',
    'http://seed5.neo.org',
    'http://api.otcgo.cn'
  ]
  let neoPort = 20332
  let cozPort = 8880
  let cozNetwork = 'test'
  let options = {
    storage: {
      model: 'mongoDB',
      connectOnInit: true,
      connectionString: 'mongodb://localhost/neo',
      collectionNames: {
        blocks: 'b_neo_t_blocks',
        transactions: 'b_neo_t_transactions',
        addresses: 'b_neo_t_addresses'
      }
    }
  }

  if (network === 'mainnet') {
    options = {
      storage: {
        model: 'mongoDB',
        connectOnInit: true,
        connectionString: 'mongodb://localhost/neo',
        collectionNames: {
          blocks: 'b_neo_m_blocks',
          transactions: 'b_neo_m_transactions',
          addresses: 'b_neo_m_addresses'
        }
      }
    }
    neoPort = 10332
    cozPort = 8080
    cozNetwork = 'seed'
  }

  // build the list of neo-maintained nodes
  neoSeeds.forEach((domain) => {
    this.nodes.push(new node({
      domain,
      port: neoPort
    }))
  })

  // build the list of CoZ maintained nodes
  const cozNodes = [1, 2, 3, 4, 5]
  cozNodes.forEach((i) => {
    this.nodes.push(new node({
      domain: `http://${cozNetwork}${i}.cityofzion.io`,
      port: cozPort
    }))
  })

  // create the local node instance
  this.localNode = new node(options)
  this.nodes.push(this.localNode)

  /**
   * Identifies and returns the fastest node based on the latency of the last transaction.
   * @returns {node} The lowest latency node instance.
   */
  this.fastestNode = () => _.minBy(
    _.filter(this.nodes, 'active'),
    'latency'
  )

  /**
   * Identifies and returns the node with the highest blockheight.
   * @returns {node} The node instance with the greatest blockHeight.
   */
  this.highestNode = () => _.maxBy(
    _.filter(this.nodes, 'active'),
    'blockHeight'
  )

  /**
   * Identifies and returns the best node that has a specific block based on an input
   * criteria.
   * @param {number} index The index of the requested block.
   * @param {string} [sort = 'latency'] The attribute to rank nodes by.
   * @param {Boolean} [allowLocal = true] A flag to indicate whether the local node (in 'full' mode) is
   * allowed
   * @returns {node} The best node that has the requested block index.
   */
  this.nodeWithBlock = (index, sort = 'latency', allowLocal = true) => _.minBy(
    _.filter(this.nodes, ({ index: nIndex, domain, active }) => {
      return active && (index <= nIndex) && (domain === 'localhost' ? allowLocal : true)
    }),
    sort
  )
}

module.exports = neo
