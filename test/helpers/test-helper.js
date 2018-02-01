const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const Neo = require('../../dist/neo')
const profiles = require('./profiles')
const MockResponses = require('./mock-responses')
const Logger = require('../../dist/common/logger')
const logger = new Logger('test:helpers', { level: Logger.levels.INFO })

module.exports = {
  getNeo: function () {
    const neo = new Neo({ network: 'testnet' })
    return neo
  },

  setMockHttpClient: function () {
    const mockHttpClient = new MockAdapter(axios, { delayResponse: 50 })
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getbestblockhash', params: [], id: 0 }).reply(200, MockResponses.getBestBlockHash.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblock', params: [profiles.Blocks.Block_100000.Number, 1], id: 0 }).reply(200, MockResponses.getBlock.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblock', params: [profiles.Blocks.Block_100000.Hash, 1], id: 0 }).reply(200, MockResponses.getBlock.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblockcount', params: [], id: 0 }).reply(200, MockResponses.getBlockCount.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblockhash', params: [profiles.Blocks.Block_100000.Number], id: 0 }).reply(200, MockResponses.getBlockHash.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblocksysfee', params: [profiles.Blocks.Block_100000.Number], id: 0 }).reply(200, MockResponses.getBlockSystemFee.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getconnectioncount', params: [], id: 0 }).reply(200, MockResponses.getConnectionCount.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getrawmempool', params: [], id: 0 }).reply(200, MockResponses.getRawMemPool.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getrawtransaction', params: [profiles.Blocks.Block_100000.Transactions[0].Hash, 1], id: 0 }).reply(200, MockResponses.getRawTransaction.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'gettxout', params: [profiles.Blocks.Block_608999.Transactions[1].Hash, 0], id: 0 }).reply(200, MockResponses.getTXOut.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getaccountstate', params: [profiles.Wallets.WalletN.Address], id: 0 }).reply(200, MockResponses.getAccountState.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getassetstate', params: [profiles.Assets.Neo], id: 0 }).reply(200, MockResponses.getAssetState.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'validateaddress', params: [profiles.Wallets.WalletN.Address], id: 0 }).reply(200, MockResponses.validateAddress.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getpeers', params: [], id: 0 }).reply(200, MockResponses.getPeers.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getcontractstate', params: [profiles.Contracts.RPX_Test], id: 0 }).reply(200, MockResponses.getContractState.Success)
    mockHttpClient.onAny().passThrough()
  },

  setHttpInterceptors: function (enable) {
    if (enable) {
      axios.interceptors.request.use((request) => {
        logger.info('== Starting request on:', new Date())
        logger.info('request:', request.method, request.url)
        logger.info('request data:', request.data)
        logger.info('adapter name:', request.adapter.name)
        return request
      })
    }
  }
}
