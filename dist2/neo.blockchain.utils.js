/**
 * Neo utils library.
 */
module.exports = {
  /**
   * Standardize hash syntax.
   * By Default it should have '0x' prefix follow by 64 hexdecimal characters.
   * @param {stirng} hash
   * @param {boolean} [withHexPrefix=true]
   * @return {string}
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
  },

  /**
   * A logger utility object.
   */
  logger: {
    _level: 0,
    setLevel: function (level) {
      this._level = level
    },
    error: function () {
      if (this._level >= 1) {
        console.error.apply(this, arguments)
      }
    },
    warn: function () {
      if (this._level >= 2) {
        console.warn.apply(this, arguments)
      }
    },
    info: function () {
      if (this._level >= 3) {
        console.log.apply(this, arguments)
      }
    },
    trace: function () {
      if (this._level >= 3) {
        console.trace.apply(this, arguments)
      }
    }
  }
}
