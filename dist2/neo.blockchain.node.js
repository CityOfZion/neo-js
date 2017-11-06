const _ = require('lodash')

/**
 * Neo Node.
 * @class
 * @public
 * @param {Object} options 
 */
const NeoNode = function (api, options = {}) {
  // Properties and default values
  this.api = api
  this.active = false
  this.blockHeight = undefined
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
    return false
  },
}

module.exports = NeoNode
