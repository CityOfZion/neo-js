const EventEmitter = require('events')
const _ = require('lodash')
const Logger = require('../common/logger')
const ValidationHelper = require('../common/validation-helper')

/**
 * @class Mesh
 * @param {Array.<Node>} nodes
 * @param {Object} options
 * @param {Object} options.loggerOptions
 */
class Mesh extends EventEmitter {
  /**
   * @fires Mesh#constructor:complete
   */
  constructor (nodes, options = {}) {
    super()

    // -- Properties
    /** @type {Array.<Node>} */
    this.nodes = []
    /** @type {Object} */
    this.logger = undefined
    /** @type {Object} */
    this.defaultOptions = {
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.nodes = nodes
    this.logger = new Logger('Mesh', this.loggerOptions)
    /**
     * @event Mesh#constructor:complete
     * @type {object}
     */
    this.emit('constructor:complete')
  }

  /**
   * @public
   * @returns {Node}
   */
  getFastestNode () {
    this.logger.debug('getFastestNode triggered.')
    // TODO: make active filter, optional
    return _.minBy(
      _.filter(this.nodes, 'active'),
      'latency'
    )
  }

  /**
   * Identifies and returns the node with the highest block height.
   * @public
   * @returns {Node}
   */
  getHighestNode () {
    this.logger.debug('getHighestNode triggered.')
    // TODO: make active filter, optional
    return _.maxBy(
      _.filter(this.nodes, 'active'),
      'blockHeight'
    )
  }

  /**
   * @public
   * @returns {Node}
   */
  getRandomNode () {
    this.logger.debug('getRandomNode triggered.')
    // TODO: getRandomNode(isActive)
    // This also picks up inactive nodes
    const targetIndex = parseInt(Math.random() * this.nodes.length)
    return this.nodes[targetIndex]
  }

  /**
   * @public
   * @returns {Node}
   */
  getNodeWithBlock (index, sort = 'latency') {
    this.logger.debug('getNodeWithBlock triggered. index:', index, 'sort:', sort)
    // NOTE: Not been used
    return _.minBy(
      _.filter(this.nodes, ({index: nIndex, active}) => {
        return active && (index <= nIndex)
      }),
      sort
    )
  }

  /**
   * @public
   * @param {string} method
   * @param {object} params
   * @returns {*}
   * @fires Mesh#rpc:init
   */
  rpc (method, params) {
    this.logger.debug('rpc triggered. method:', method, 'params:', params)
    /**
     * @event Mesh#rpc:init
     * @type {object}
     * @property {string} method
     * @property {object} params
     */
    this.emit('rpc:init', { method, params })
    const node = (this.getHighestNode() || this.nodes[0])
    if (ValidationHelper.isValidNode(node)) {
      return node.rpc[method](params)
    }

    // Error
    this.logger.error('Unable to find a valid node.')
    throw new Error('Unable to find a valid node.')
  }
}

module.exports = Mesh
