/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
const _ = require('lodash')
const profiles = require('../common/profiles')
const Logger = require('../common/logger')

/**
 * @class Mesh
 */
class Mesh {
  constructor (nodes, options = {}) {
    // -- Properties
    this.nodes = []
    this.defaultOptions = {
      logger: new Logger('Mesh')
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.nodes = nodes
  }

  /**
   * @access public
   */
  getFastestNode () {
    // TODO: make active filter, optional
    return _.minBy(
      _.filter(this.nodes, 'active'),
      'latency'
    )
  }

  /**
   * Identifies and returns the node with the highest block height.
   * @access public
   * @returns {node} The node instance with the greatest blockHeight.
   */
  getHighestNode () {
    // TODO: make active filter, optional
    return _.maxBy(
      _.filter(this.nodes, 'active'),
      'blockHeight'
    )
  }

  /**
   * @access public
   */
  getRandomNode () {
    // TODO: getRandomNode(isActive)
    // This also picks up inactive nodes
    const targetIndex = parseInt(Math.random() * this.nodes.length)
    return this.nodes[targetIndex]
  }

  /**
   * @access public
   */
  getNodeWithBlock (index, sort = 'latency') {
    // NOTE: Not been used
    return _.minBy(
      _.filter(this.nodes, ({index: nIndex, active}) => {
        return active && (index <= nIndex)
      }),
      sort
    )
  }

  /**
   * @access public
   * @param {string} method
   * @param {object} params
   */
  rpc (method, params) {
    // Alias of mesh.getHighestNode().rpc()
    return (this.getHighestNode() || this.nodes[0]).rpc[method](params)
  }
}

module.exports = Mesh
