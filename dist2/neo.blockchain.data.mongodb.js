const mongoose = require('mongoose')
const _ = require('lodash')

/**
 * MongoDB Data Access
 * @class
 * @public
 * @param {Object} options 
 */
const MongoDA = function (options = {}) {
  // Properties and default values
  this.options = _.assign({}, MongoDA.Defaults, options)

  // Bootstrap
}

/**
 * Default options for RPC client.
 * @public
 */
MongoDA.Defaults = {
}

MongoDA.prototype = {
}

module.exports = MongoDA
