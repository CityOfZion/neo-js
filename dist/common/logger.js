const loglevel = require('loglevel')
const moment = require('moment')

/**
 * @class Logger
 * @param {string} name
 * @param {Object} options
 * @param {string} options.level
 * @param {boolean} options.displayTimestamp
 * @param {boolean} options.displayName
 * @param {boolean} options.displayLevel
 * @param {string} options.timestampFormat
 */
class Logger {
  constructor (name, options = {}) {
    // TODO: refactor formatting with usage of defaultOptions
    // TODO: support text color setting
    // TODO: create an enum to store color values
    this.name = name

    // Associate class properties
    Object.assign(this, {
      level: loglevel.levels.WARN,
      displayTimestamp: true,
      displayName: true,
      displayLevel: true,
      timestampFormat: 'hh:mm:ss.SSS'
    }, options)

    // Bootstrapping
    this.logger = loglevel.getLogger(this.name)
    this.logger.setLevel(this.level)
  }

  /**
   * @type {string}
   */
  static get levels () {
    return loglevel.levels
  }

  /**
   * @public
   * @param {string} level
   * @returns {void}
   */
  setLevel (level) {
    this.logger.setLevel(level)
  }

  /**
   * @public
   * @returns {void}
   */
  trace () {
    const args = this.manipulateArguments(arguments, 'trace')
    this.logger.trace.apply(this, args)
  }

  /**
   * @public
   * @returns {void}
   */
  debug () {
    const args = this.manipulateArguments(arguments, 'debug')
    this.logger.debug.apply(this, args)
  }

  /**
   * @public
   * @returns {void}
   */
  info () {
    const args = this.manipulateArguments(arguments, 'info')
    this.logger.info.apply(this, args)
  }

  /**
   * @public
   * @returns {void}
   */
  warn () {
    const args = this.manipulateArguments(arguments, 'warn')
    this.logger.warn.apply(this, args)
  }

  /**
   * @public
   * @returns {void}
   */
  error () {
    const args = this.manipulateArguments(arguments, 'error')
    this.logger.error.apply(this, args)
  }

  /**
   * @private
   * @param {Object} argumentsObject
   * @param {string} level
   * @returns {Array}
   */
  manipulateArguments (argumentsObject, level) {
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
