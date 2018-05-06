/* eslint handle-callback-err: "off" */
const EventEmitter = require('events')
const Logger = require('../common/logger')
const Rpc = require('./rpc')

/**
 * @class Node
 * @param {object} options
 * @param {string} options.domain
 * @param {number} options.port
 * @param {object} options.rpcOptions
 * @param {object} options.loggerOptions
 */
class Node extends EventEmitter {
  /**
   * @fires Node#constructor:complete
   */
  constructor (options = {}) {
    super()

    // -- Properties
    /** @type {boolean} */
    this.active = true // TODO: rename to isActive, and default value should be undefined
    /** @type {number} */
    this.latency = 9999 // NOTE: a hack around unverified node been picked up as 'fastest' // Alias: lastLatency
    /** @type {number} */
    this.blockHeight = 0 // NOTE: same as block count
    /** @type {number} */
    this.index = -1 // blockHeight - 1 // TODO: deprecate this
    /** @type {number} */
    this.connections = 0
    /** @type {number} */
    this.pendingRequests = 0
    /** @type {number} */
    this.age = undefined // TODO: rename to lastSeen
    /** @type {object} */
    this.rpc = undefined
    /** @type {object} */
    this.logger = undefined
    /** @type {object} */
    this.defaultOptions = {
      domain: undefined,
      port: undefined,
      rpcOptions: {},
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.initLogger()
    this.initRpc()
    /**
     * @event Node#constructor:complete
     * @type {object}
     */
    this.emit('constructor:complete')
  }

  /**
   * @private
   * @returns {void}
   */
  initLogger () {
    this.logger = new Logger('Node', this.loggerOptions)
  }

  /**
   * @private
   * @returns {void}
   */
  initRpc () {
    this.rpc = new Rpc(this.domain, this.port, this.rpcOptions)
  }

  /**
   * @public
   * @returns Promise.<void>
   */
  ping () {
    this.logger.debug('ping triggered.', `node: [${this.domain}:${this.port}]`)
    return new Promise((resolve, reject) => {
      const t0 = Date.now()
      this.pendingRequests += 1
      this.rpc.getBlockCount()
        .then((res) => {
          this.logger.debug('rpc.getBlockCount success:', res)
          const blockCount = res
          this.blockHeight = blockCount
          this.index = blockCount - 1
          this.active = true
          this.age = Date.now()
          this.latency = this.age - t0
          this.pendingRequests -= 1
          this.logger.debug('latency:', this.latency)
          resolve()
        })
        .catch((err) => {
          this.logger.debug('rpc.getBlockCount failed. move on.')
          this.active = false
          this.age = Date.now()
          this.pendingRequests -= 1
          resolve()
        })
    })
  }
}

module.exports = Node
