const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const Neo = require('../../dist/node')
const Profiles = require('./profiles')
const MockResponses = require('./mock-responses')

module.exports = {
  getNeoNode: function () {
    const node = new Neo({ network: 'testnet' })
    return node
  },

  setMockHttpClient: function () {
    const mockHttpClient = new MockAdapter(axios, { delayResponse: 50 })
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getbestblockhash', params: [], id: 0 }).reply(200, MockResponses.getBestBlockHash.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblock', params: [Profiles.Blocks.Block_100000.Number, 1], id: 0 }).reply(200, MockResponses.getBlock.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblock', params: [Profiles.Blocks.Block_100000.Hash, 1], id: 0 }).reply(200, MockResponses.getBlock.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblockcount', params: [], id: 0 }).reply(200, MockResponses.getBlockCount.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblockhash', params: [Profiles.Blocks.Block_100000.Number], id: 0 }).reply(200, MockResponses.getBlockHash.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblocksysfee', params: [Profiles.Blocks.Block_100000.Number], id: 0 }).reply(200, MockResponses.getBlockSystemFee.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getconnectioncount', params: [], id: 0 }).reply(200, MockResponses.getConnectionCount.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getrawmempool', params: [], id: 0 }).reply(200, MockResponses.getRawMemPool.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getrawtransaction', params: [Profiles.Blocks.Block_100000.Transactions[0].Hash, 1], id: 0 }).reply(200, MockResponses.getRawTransaction.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'gettxout', params: [Profiles.Blocks.Block_608999.Transactions[1].Hash, 0], id: 0 }).reply(200, MockResponses.getTXOut.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getaccountstate', params: [Profiles.Wallets.WalletN.Address], id: 0 }).reply(200, MockResponses.getAccountState.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getassetstate', params: [Profiles.Assets.Neo], id: 0 }).reply(200, MockResponses.getAssetState.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'validateaddress', params: [Profiles.Wallets.WalletN.Address], id: 0 }).reply(200, MockResponses.validateAddress.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getpeers', params: [], id: 0 }).reply(200, MockResponses.getPeers.Success)
    mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getcontractstate', params: [Profiles.Contracts.RPX_Test], id: 0 }).reply(200, MockResponses.getContractState.Success)
    mockHttpClient.onAny().passThrough()
  },

  setHttpInterceptors: function (enable) {
    if (enable) {
      axios.interceptors.request.use((request) => {
        console.log('== Starting request on:', new Date())
        console.log('request:', request.method, request.url)
        console.log('request data:', request.data)
        console.log('adapter name:', request.adapter.name)
        console.log()
        return request
      })
    }
  }
}
