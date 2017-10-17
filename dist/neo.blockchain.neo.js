/**
 *
 *  An instance of the neo blockchain
 * @class
 * @requires lodash
 * @requires neo.blockchain.node
 * @requires neo.blockchain.sync
 * @requires neo.blockchain.db
 * @param {string} mode Sets whether the library should run in full or light mode.
 * @param {string} network Indicates which network to operate the instance on.
 * @example
 * var neoBlockchain = neo('full', 'testnet') //Creates a new full node instance on testnet.
 * @example
 * var neoBlockchain = neo('light', 'mainnet') //Creates a new light node instances on mainnet.
 */
function neo (mode, network) {
  const _ = require('lodash')
  const sync = require('./neo.blockchain.sync')

  /** {string} The operating mode of the instance ('full', 'light').*/
  /** {string} The network for the instance to attach to ('testnet', 'mainnet').*/
  /** {Array} The array of nodes that the instance currently has access to. */
  Object.assign(this, {
    mode,
    network,
    sync: new sync.sync(this),
    node: require('./neo.blockchain.node')(network),
  })
  this.nodes = this.node.nodes

  if (this.mode == 'full') {
    Object.assign(this, {
      db: require('./neo.blockchain.db')(network),
      localNode: new this.db.node() //Initialize the local node.
    });

    /** {node} A direct reference to the local node when running in 'full' mode.*/
    this.nodes.push(this.localNode) //Add the local node to the pool of options for general queries.
  }

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
    _.filter(
      this.nodes,
      ({ index: nIndex, domain, active }) => active && (index <= nIndex) && (
        domain == 'localhost' ?
          allowLocal :
          true
    ),
    sort
  )
}

exports.neo = neo
