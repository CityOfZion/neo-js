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
  },

  logger: {
    _level: 0,
    setLevel: function (level) {
      this._level = level
    },
    error: function() {
      if(this._level >= 1) {
        console.error.apply(this, arguments);
      }
    },
    warn: function() {
      if(this._level >= 2) {
        console.warn.apply(this, arguments);
      }
    },
    info: function() {
      if(this._level >= 3) {
        console.log.apply(this, arguments);
      }
    },
  }
}
