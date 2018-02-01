/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
const _ = require('lodash')
const profiles = require('../common/profiles')
const Logger = require('../common/logger')
const Rpc = require('./rpc')

/**
 * @class Node
 */
class Node {
  constructor (options = {}) {
    // -- Properties
    this.active = true // TODO: rename to isActive
    this.latency = 9999 // NOTE: a hack around unverified node been picked up as 'fastest' // Alias: lastLatency
    this.blockHeight = 0 // NOTE: same as block count
    this.index = -1 // blockHeight - 1 // TODO: deprecate this
    this.connections = 0
    this.age = undefined // TODO: rename to lastSeen
    this.rpc = undefined
    this.defaultOptions = {
      domain: undefined,
      port: undefined,
      logger: new Logger('Node')
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.rpc = new Rpc(this.domain, this.port)
  }
}

module.exports = Node
