const Logger = require('./logger')
const logger = new Logger('hash-helper')

class HashHelper {
  /**
   * Standardize hash value with 0x prefix.
   * @static
   * @param {string} hash
   * @return {string}
   */
  static normalize (hash) {
    logger.debug('normalize triggered. hash:', hash)
    // TODO: validate input hash, throw error if invalid
    if (hash.startsWith('0x')) {
      return hash
    } else {
      return '0x' + hash
    }
  }

  /**
   * Reverse hash standardization by omit 0x prefix.
   * @static
   * @param {string} hash
   * @return {string}
   */
  static denormalize (hash) {
    logger.debug('normalize triggered. hash:', hash)
    // TODO: validate input hash, throw error if invalid
    if (hash.startsWith('0x')) {
      return hash.slice(2)
    } else {
      return hash
    }
  }
}

module.exports = HashHelper
