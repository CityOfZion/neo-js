const _ = require('lodash')

/**
 * Neo Node.
 * @class
 * @public
 * @param {Object} api
 * @param {Object} options 
 */
const NeoNode = function (api, options = {}) {
  // Properties and default values
  this.api = api
  this.active = false
  this.index = -1
  this.blockHeight = 0
  this.latency = undefined
  this.pendingRequests = 0
  this.options = _.assign({}, NeoNode.Defaults, options)
}

/**
 * Default options.
 * @public
 */
NeoNode.Defaults = {
  eventEmitter: undefined,
  verboseLevel: undefined,
}

NeoNode.prototype = {
  isLocalNode: function () {
    return (this.api.url === 'localhost')
  },

  verifyBlocks: function () {
    return new Error('not implemented')
  }
}

module.exports = NeoNode
