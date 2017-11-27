/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
const _ = require('lodash')


/**
 * @class mesh
 * @description
 * A representation of the external node mesh that this local node instance
 * will interface with.
 * @param {Object} options Configuration parameters for the mesh.
 * @example
 * neo = require('neo-js-blockchain');
 * const n = node()
 * n.mesh.rpc('getBlock', 1000)
 */
class mesh {
  constructor (options = {}) {
    Object.assign(this, {
      network: 'testnet',
      nodes: []
    }, options)

    const node = require('../node')

    let neoPort = 20332
    let cozPort = 8880
    let cozNetwork = 'test'

    if (this.network === 'mainnet') {
      neoPort = 10332
      cozPort = 8080
      cozNetwork = 'seed'
    }

    // build the list of neo maintained nodes
    const neoNodes = [1, 2, 3, 4, 5]
    neoNodes.forEach((i) => {
      this.nodes.push(new node({
        domain: `http://seed${i}.neo.org`,
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

  }

  /**
   * Identifies and returns the fastest node based on the latency of the last transaction.
   * @returns {node} The lowest latency node instance.
   */
  fastestNode () {
    return _.minBy(
    _.filter(this.nodes, 'active'),
    'latency'
    )
  }

  /**
   * Identifies and returns the node with the highest blockheight.
   * @returns {node} The node instance with the greatest blockHeight.
   */
  highestNode () {
    return _.maxBy(
    _.filter(this.nodes, 'active'),
    'blockHeight'
    )
  }

  /**
   * Identifies and returns the best node that has a specific block based on an input
   * criteria.
   * @param {number} index The index of the requested block.
   * @param {string} [sort = 'latency'] The attribute to rank nodes by.
   * @param {Boolean} [allowLocal = true] A flag to indicate whether the local node (in 'full' mode) is
   * allowed
   * @returns {node} The best node that has the requested block index.
   */
  nodeWithBlock (index, sort = 'latency') {
    return _.minBy(
    _.filter(this.nodes, ({index: nIndex, active}) => {
      return active && (index <= nIndex)
    }),
    sort
    )
  }

  /**
   * Gets a JSON formatted block from the mesh.
   * @param index {number} The block index being requested.
   * @param [sort = 'latency'] {String} The method used to identify a node in the mesh.
   * @returns {Promise.<Object>}
   */
  getBlock (index, sort = 'latency') {
    return this.nodeWithBlock(index, sort).rpc.getBlock(index)
  }

  /**
   * Executes an rpc method against the highest blockHeight node
   * in the mesh.
   * @param method {String} The method to execute.
   * @param params {Array} An array of input parameters.
   * @returns {Promise.<*>} The response of the rpc method.
   */
  rpc (method, params) {
    return this.highestNode().rpc[method](params)
  }
}

module.exports = mesh
