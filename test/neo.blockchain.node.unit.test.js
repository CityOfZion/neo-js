/**
 * Unit Testing
 */
/* global describe it */
const expect = require('chai').expect
const Neo = require('../dist/neo.blockchain.neo').neo
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const Profiles = require('./helpers/profiles')
const MockResponses = require('./helpers/mock-responses')

// Bootstrapping

const neoBlockchain = new Neo('light', 'testnet')
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false)

// Mock Adapter

const mockHttpClient = new MockAdapter(axios, { delayResponse: 50 })
mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getbestblockhash', params: [], id: 0 }).reply(200, MockResponses.getBestBlockHash.Success)
mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblock', params: [100000,1], id: 0 }).reply(200, MockResponses.getBlock.Success)
mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblock', params: ['0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122',1], id: 0 }).reply(200, MockResponses.getBlock.Success)
mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getblockcount', params: [], id: 0 }).reply(200, MockResponses.getBlockCount.Success)
mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getaccountstate', params: [Profiles.Wallets.WalletN.Address], id: 0 }).reply(200, MockResponses.getAccountState.Success)
mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'getassetstate', params: [Profiles.Assets.Neo], id: 0 }).reply(200, MockResponses.getAssetState.Success)
mockHttpClient.onPost(/(.*)/, { jsonrpc: '2.0', method: 'validateaddress', params: [Profiles.Wallets.WalletN.Address], id: 0 }).reply(200, MockResponses.validateAddress.Success)
mockHttpClient.onAny().passThrough()

// Axios Interceptors

const ENABLE_INTERCEPTORS = false
if (ENABLE_INTERCEPTORS) {
  axios.interceptors.request.use((request) => {
    console.log('== Starting request on:', new Date())
    console.log('request:', request.method, request.url)
    console.log('request data:', request.data)
    console.log('adapter name:', request.adapter.name)
    console.log()
    return request
  })
}

// Test Cases

// TODO: getBalance

describe('Unit test getBestBlockHash()', () => {
  it('should have string as its response data type.', (resolve) => {
    neoNode.getBestBlockHash()
      .then((res) => {
        const hash = res
        expect(hash).to.be.a('string')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should be '0x' follow by 64 hex characters in lower-case.", (resolve) => {
    neoNode.getBestBlockHash()
      .then((res) => {
        const hash = res
        expect(hash).to.match(/^(0x)[a-f0-9]{64}$/)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test getBlock()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.getBlock(100000)
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contains 'confirmations' property with a whole number.", (resolve) => {
    neoNode.getBlock(100000)
      .then((res) => {
        expect(res.confirmations).to.be.a('number')
        expect(res.confirmations % 1).to.be.equal(0)
        expect(res.confirmations).to.be.at.least(1)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test getBlockByHash()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.getBlockByHash('0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122')
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contains 'confirmations' property with a whole number.", (resolve) => {
    neoNode.getBlockByHash('0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122')
      .then((res) => {
        expect(res.confirmations).to.be.a('number')
        expect(res.confirmations % 1).to.be.equal(0)
        expect(res.confirmations).to.be.at.least(1)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test getBlockCount()', () => {
  it('should have integer as its response data type.', (resolve) => {
    neoNode.getBlockCount()
      .then((res) => {
        const blockCount = res
        expect(blockCount).to.be.a('number')
        expect(blockCount % 1).to.be.equal(0)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it('should have at least 1 block.', (resolve) => {
    neoNode.getBlockCount()
      .then((res) => {
        const blockCount = res
        expect(blockCount).to.be.at.least(1)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

// TODO: getBlockHash
// TODO: getBlockSystemFee
// TOOD: getConnectionCount
// TODO: getRawMemPool
// TODO: getRawTransaction
// TODO: getTXOut
// TOOD: sendRawTransaction
// TODO: sendToAddress
// TODO: submitBlock

describe('Unit test getAccountState()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.getAccountState(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contain 'script_hash' property with an expected value of '0x869575db91de0265118002f26e00fe1d4a89b9f0'.", (resolve) => {
    neoNode.getAccountState(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res.script_hash).to.be.equal('0x869575db91de0265118002f26e00fe1d4a89b9f0')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test getAssetState()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.getAssetState(Profiles.Assets.Neo)
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contain 'id' property with an expected value of '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b'.", (resolve) => {
    neoNode.getAssetState(Profiles.Assets.Neo)
      .then((res) => {
        expect(res.id).to.be.equal('0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test validateAddress()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.validateAddress(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contain 'isvalid' property with an expected value of true.", (resolve) => {
    neoNode.validateAddress(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res.isvalid).to.be.equal(true)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

// TODO: getPeers
