const Rpc = function (network, options = {}) {
    this.network = network
    this.enum = options.enum || require('./neo.blockchain.enum')
}

Rpc.prototype = {
    foo: function () {
        return 42
    }
}

module.exports = Rpc