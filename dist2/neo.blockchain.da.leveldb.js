const _ = require('lodash')

/**
 * LevelDB Data Access
 * @todo To be implemented.
 * @class
 * @public
 * @param {Object} connectionInfo
 * @param {Object} [options]
 */
const LevelDa = function (connectionInfo, options = {}) {
  // Properties and default values
  this.connectionInfo = connectionInfo
  this.options = _.assign({}, LevelDa.Defaults, options)
}

/**
 * Default options.
 * @public
 */
LevelDa.Defaults = {
}

LevelDa.prototype = {
  getBlock: function (index) {
    return new Error('Not implemented.')
  },

  getBlockCount: function () {
    return new Error('Not implemented.')
  }
}

module.exports = LevelDa
