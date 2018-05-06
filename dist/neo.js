/* eslint handle-callback-err: "off" */
const EventEmitter = require('events')
const Storage = require('./node/storage')
const Mesh = require('./node/mesh')
const Wallet = require('./wallet')
const SyncStrategy = require('./strategy/sync-strategy')
const Logger = require('./common/logger')
const profiles = require('./common/profiles')
const Node = require('./node/node')
const packageJson = require('../package.json')

/**
 * @class Neo
 * @augments EventEmitter
 * @param {object} options
 * @param {number} options.workerCount
 * @param {string} options.network
 * @param {object} options.meshOptions
 * @param {object} options.nodeOptions
 * @param {object} options.storageOptions
 * @param {object} options.walletOptions
 * @param {object} options.loggerOptions
 */
class Neo extends EventEmitter {
  /**
   * @fires Neo#constructor:complete
   * @fires Neo#storeBlock:complete
   */
  constructor (options = {}) {
    super()

    // -- Properties
    /** @type {object} */
    this.mesh = undefined
    /** @type {object} */
    this.wallet = undefined
    /** @type {object} */
    this.syncStrategy = undefined
    /** @type {object} */
    this.storage = undefined
    /** @type {object} */
    this.logger = undefined
    /** @type {object} */
    this.defaultOptions = {
      workerCount: 20,
      network: undefined,
      meshOptions: {},
      nodeOptions: {},
      storageOptions: {},
      walletOptions: {},
      syncStrategyOptions: {},
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.logger = new Logger('Neo', this.loggerOptions)
    this.initMesh()
    this.initWallet()
    this.initStorage()
    this.initSyncStrategy()

    // -- Event Handlers
    /**
     * @event Neo#storeBlock:complete
     * @type {object}
     */
    this.syncStrategy.on('storeBlock:complete', (payload) => this.emit('storeBlock:complete', payload))

    /**
     * @event Neo#constructor:complete
     * @type {object}
     */
    this.emit('constructor:complete')
  }

  /**
   * @static
   * @public
   * @returns {string}
   */
  static get VERSION () {
    return packageJson.version
  }

  /**
   * @public
   * @returns {string}
   */
  get VERSION () {
    return packageJson.version
  }

  /**
   * @private
   * @returns {void}
   */
  initMesh () {
    const nodes = this.getNodes()
    this.mesh = new Mesh(nodes, this.meshOptions)
  }

  /**
   * @private
   * @returns {void}
   */
  initWallet () {
    this.logger.debug('initWallet triggered.')
    const options = Object.assign(this.walletOptions, { network: this.network })
    this.wallet = new Wallet(options)
  }

  /**
   * @private
   * @returns {void}
   */
  initStorage () {
    if (this.storageOptions) {
      this.storage = new Storage(this.storageOptions)
      this.logger.info('storage setup complete. storage.model:', this.storage.model)
      if (this.storage.model !== 'mongoDB') {
        this.logger.error('Unsupported storage model:', this.storage.model)
      }
    } else {
      this.logger.error('Invalid storageOptions variable.')
    }
  }

  /**
   * @private
   * @returns {void}
   */
  initSyncStrategy () {
    this.syncStrategy = new SyncStrategy(this.mesh, this.storage, this.syncStrategyOptions)
  }

  /**
   * @private
   * @returns Array.<Node>
   */
  getNodes () {
    this.logger.debug('getNodes triggered. this.network:', this.network)
    let nodes = []
    let endpoints = []

    // TODO: validate network
    // fetch endpoint infos base on network type
    if (this.network === 'mainnet') {
      endpoints = profiles.rpc.mainnet.endpoints
    } else if (this.network === 'testnet') {
      endpoints = profiles.rpc.testnet.endpoints
    } else {
      endpoints = this.network.endpoints
    }
    // TODO: validate result endpoints
    this.logger.debug('endpoints:', endpoints)

    endpoints.forEach((endpoint) => {
      const options = Object.assign(this.nodeOptions, { domain: endpoint.domain, port: endpoint.port })
      nodes.push(new Node(options))
    })

    return nodes
  }
}

module.exports = Neo
