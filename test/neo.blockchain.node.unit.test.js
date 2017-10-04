/**
 * Unit Testing
 */
/* global describe it */
const expect = require('chai').expect
const Neo = require('../dist/neo.blockchain.neo').neo
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const Profiles = {
  Assets: {
    Neo: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
    Gas: '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7'
  }
}

// Bootstrapping

const neoBlockchain = new Neo('light', 'testnet')
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false)

// Mock Adapter

const mockHttpClient = new MockAdapter(axios, { delayResponse: 50 })
const mockResponseData = {
  getBalance: {
    AccessDenied: {'code': -400, 'message': 'Access denied.', 'data': '   at Neo.Network.RPC.RpcServerWithWallet.Process(String method, JArray _params)\r\n   at Neo.Network.RPC.RpcServer.ProcessRequest(JObject request)'}
  },
  getBestBlockHash: {
    Success: { jsonrpc: '2.0', id: 0, result: '0xf760b3dd56a44e6b139d2a072d9f20ae503e13d01ef9f2385043b90f3a8ae876' },
    Legacy: { jsonrpc: '2.0', id: 0, result: 'f760b3dd56a44e6b139d2a072d9f20ae503e13d01ef9f2385043b90f3a8ae876' } // Deprecating (yet, not completely obsolete) hash syntax without leading '0x'.
  },
  getBlock: {
    Success: {
      jsonrpc: '2.0',
      id: 0,
      result: {
        hash: '0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122',
        size: 686,
        version: 0,
        previousblockhash: '0xdea902d1ddb8bbd3000d1cbc96a5a69b2170a5f993cce23eb5bb955920f43454',
        merkleroot: '0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042',
        time: 1496454840,
        index: 100000,
        nonce: '40fcadce5e6f395a',
        nextconsensus: 'AdyQbbn6ENjqWDa5JNYMwN3ikNcA4JeZdk',
        script: {
          invocation: '400190144d56bf951badc561395712a86e305b373592ff7ee559d6db0934adb6e116247a8ccc5d42858e9201beedbe904adabe7fd250bc9d1814e8d3ed1b48293d408b78d73679bc45c085ec9c0423ba79889710101918170cd48ebea16e7befd555aa23ee0c256fcd3228f614ba5b607e077dffaf5614e9f7ce78a3c5d60a92baba40170495d99bc2665277d5512eddde13cea37bf74b5c265a3e741783c0837e7f5909a6383780cb5ff03af04e4085ede121a7f94d1c0ddc371cae5e8b968f18f8d440d36e5b7dcfe49894f12cf50476098fb5423ffd36154cee652cdf1cee50fda9240ca6a6cf3cf824457afa45f07661a8c35b6bc0e7f334a903c99b5683b5bf53ce40cc0ad387dedff608e4c032b598e0a54668d9ec2c46e207ea294c76844a3ff951dca324148eca3dc6938402fb2fe5006fbc551f4f1a09d6366c126f787a06c063',
          verification: '55210209e7fd41dfb5c2f8dc72eb30358ac100ea8c72da18847befe06eade68cebfcb9210327da12b5c40200e9f65569476bbff2218da4f32548ff43b6387ec1416a231ee821034ff5ceeac41acf22cd5ed2da17a6df4dd8358fcb2bfb1a43208ad0feaab2746b21026ce35b29147ad09e4afe4ec4a7319095f08198fa8babbe3c56e970b143528d2221038dddc06ce687677a53d54f096d2591ba2302068cf123c1f2d75c2dddc542557921039dafd8571a641058ccc832c5e2111ea39b09c0bde36050914384f7a48bce9bf92102d02b1873a0863cd042cc717da31cea0d7cf9db32b74d4c72c01b0011503e2e2257ae'
        },
        tx: [{
          txid: '0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042',
          size: 10,
          type: 'MinerTransaction',
          version: 0,
          attributes: [],
          vin: [],
          vout: [],
          sys_fee: '0',
          net_fee: '0',
          scripts: [],
          nonce: 1584347482
        }],
        confirmations: 510154,
        nextblockhash: '0xc8880a1a91915b3d7d48265d1bafd8fe120e1571c02924ee4ca005d03e348ecb'
      }
    }
  },
  getBlockCount: {
    Success: { jsonrpc: '2.0', id: 0, result: 100000 }
  },
}

// Experimental (and non functional)
// mockHttpClient.onPost('/', '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}').reply(505, {}) // Doesn't work
// mockHttpClient.onPost('/', {body: '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}'}).reply(505, {}) // Doesn't work
// mockHttpClient.onPost('/', {data: '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}'}).reply(505, {}) // Doesn't work
// mockHttpClient.onPost('/', {body: {data: '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}'}}).reply(505, {}) // Doesn't work
// mockHttpClient.onAny().passThrough()

mockHttpClient.onPost().reply((config) => {
  const dataObj = JSON.parse(config.data)

  if (dataObj.method === 'getbalance') {
    // placeholder
  } else if (dataObj.method === 'getbestblockhash') {
    return [200, mockResponseData.getBestBlockHash.Success]
  } else if (dataObj.method === 'getblock') {
    return [200, mockResponseData.getBlock.Success]
  } else if (dataObj.method === 'getblockcount') {
    return [200, mockResponseData.getBlockCount.Success]
  }

  console.log('YOU SHOULDNT BE HERE!')
  return [400, {}]
})

// Test cases

// describe('Unit test getBalance()', () => {
// })

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
