const loglevel = require('loglevel')
const moment = require('moment')

/**
 * @todo Better edge case handling and error throwing
 * @class Logger
 * @param {String} name
 * @param {Object} options
 */
class Logger {
  constructor (name, options = {}) {
    this.name = name

    // Associate class properties
    Object.assign(this, {
      // level: loglevel.levels.WARN,
      level: loglevel.levels.TRACE,
      displayTimestamp: true,
      displayName: true,
      displayLevel: true,
      timestampFormat: 'hh:mm:ss.SSS'
    }, options)

    // Bootstrapping
    this.logger = loglevel.getLogger(this.name)
    this.logger.setLevel(this.level)
  }

  static get levels () {
    return loglevel.levels
  }

  /**
   * @param {String} level
   */
  setLevel (level) {
    this.logger.setLevel(level)
  }

  trace () {
    const args = this._manipulateArguments(arguments, 'trace')
    this.logger.trace.apply(this, args)
  }

  debug () {
    const args = this._manipulateArguments(arguments, 'debug')
    this.logger.debug.apply(this, args)
  }

  info () {
    const args = this._manipulateArguments(arguments, 'info')
    this.logger.info.apply(this, args)
  }

  warn () {
    const args = this._manipulateArguments(arguments, 'warn')
    this.logger.warn.apply(this, args)
  }

  error () {
    const args = this._manipulateArguments(arguments, 'error')
    this.logger.error.apply(this, args)
  }

  /**
   * @private
   * @param {Object} argumentsObject
   * @param {String} level
   */
  _manipulateArguments (argumentsObject, level) {
    let args = Array.prototype.slice.call(argumentsObject)

    // Prepend items in reverse order
    if (this.displayLevel) {
      const levelLabel = level + ':'
      args.unshift('\x1b[1m' + levelLabel + '\x1b[0m')
    }
    if (this.displayName) {
      args.unshift('\x1b[36m' + this.name + '\x1b[0m')
    }
    if (this.displayTimestamp) {
      const tsLabel = moment().format(this.timestampFormat)
      args.unshift('\x1b[2m' + tsLabel + '\x1b[0m')
    }

    return args
  }
}

module.exports = Logger
