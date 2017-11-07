const _ = require('lodash')
const Utils = require('./neo.blockchain.utils')
const Logger = Utils.logger

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
  // Bootstrap
  Logger.setLevel(this.options.verboseLevel)
}

/**
 * Default options.
 * @public
 */
NeoNode.Defaults = {
  eventEmitter: undefined,
  verboseLevel: 2,
}

NeoNode.prototype = {
  isLocalNode: function () {
    return (this.api.url === 'localhost')
  },

  verifyBlocks: function () {
    if (!this.isLocalNode()) {
      Logger.warn('verifyBlocks method is only available to local node.')
      return Promise.resolve()
    }
  
    const start = 0
    const end = this.index
    const missing = []
    let pointer = -1

    return new Promise((resolve, reject) => {
      this.api.getAllBlocks()
        .then((res) => {
          Logger.info('Blockchain Verification: Scanning...')
          res.forEach((d) => {
            while (true) {
              pointer++
              if (d.index === pointer) {
                break
              } else {
                missing.push(pointer)
              }
            }
          })
          Logger.info('Blockchain Verification: Found ' + missing.length + ' missing')
          resolve(missing)
        })
    })
  }
}

module.exports = NeoNode
