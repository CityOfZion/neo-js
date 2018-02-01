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
   * @access public
   * @param {string} level
   */
  setLevel (level) {
    this.logger.setLevel(level)
  }

  /**
   * @access public
   */
  trace () {
    const args = this.manipulateArguments(arguments, 'trace')
    this.logger.trace.apply(this, args)
  }

  /**
   * @access public
   */
  debug () {
    const args = this.manipulateArguments(arguments, 'debug')
    this.logger.debug.apply(this, args)
  }

  /**
   * @access public
   */
  info () {
    const args = this.manipulateArguments(arguments, 'info')
    this.logger.info.apply(this, args)
  }

  /**
   * @access public
   */
  warn () {
    const args = this.manipulateArguments(arguments, 'warn')
    this.logger.warn.apply(this, args)
  }

  /**
   * @access public
   */
  error () {
    const args = this.manipulateArguments(arguments, 'error')
    this.logger.error.apply(this, args)
  }

  /**
   * @access private
   * @param {Object} argumentsObject
   * @param {string} level
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
