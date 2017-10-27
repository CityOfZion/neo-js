/**
 * Neo utils library.
 */
module.exports = {
  /**
   * TBA
   */
  normaliseHash: function (hash, withHexPrefix = true) {
    if (withHexPrefix) {
      if (hash.length === 64) { // TODO: better validation method
        return '0x' + hash
      } else {
        return hash
      }
    } else {
      if (hash.length > 64) { // TODO: better validation method
        return hash.slice(2)
      } else {
        return hash
      }
    }
  }

}
