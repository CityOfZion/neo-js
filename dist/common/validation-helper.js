const Logger = require('./logger')
const logger = new Logger('validation-helper')

/**
 * @class ValidationHelper
 */
class ValidationHelper {
  /**
   * Verify if it is a valid Node object.
   * @static
   * @public
   * @param {object} hash
   * @returns {boolean}
   */
  static isValidNode (node) {
    logger.debug('isValidNode triggered.')
    return !!(node)
  }
}

module.exports = ValidationHelper
