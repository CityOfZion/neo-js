module.exports = {
  getBalance: {
    AccessDenied: {code: -400, message: 'Access denied.', data: '   at Neo.Network.RPC.RpcServerWithWallet.Process(String method, JArray _params)\r\n   at Neo.Network.RPC.RpcServer.ProcessRequest(JObject request)'}
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
  getBlockHash: {
    Success: { jsonrpc: '2.0', id: 0, result: '0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122' }
  },
  getBlockSystemFee: {
    Success: { jsonrpc: '2.0', id: 0, result: '905' }
  },
  getConnectionCount: {
    Success: { jsonrpc: '2.0', id: 0, result: 15 }
  },
  getRawMemPool: {
    Success: { jsonrpc: '2.0', id: 0, result: [] }
  },
  getRawTransaction: {
    Success: {
      jsonrpc: '2.0',
      id: 0,
      result: {
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
        nonce: 1584347482,
        blockhash: '0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122',
        confirmations: 537944,
        blocktime: 1496454840
      }
    }
  },
  getTXOut: {
    Success: {
      jsonrpc: '2.0',
      id: 0,
      result: {
        n: 0,
        asset: '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
        value: '5',
        address: 'Adii5po62hCCS9s9upsK6bXdWJosjHBt4G'
      }
    },
    IndexOutOfRange: {code: -2146233086, message: 'Index was out of range. Must be non-negative and less than the size of the collection.\r\nParameter name: index'},
    InvalidFormat: {code: -2146233033, message: 'One of the identified items was in an invalid format.'}
  },
  getAccountState: {
    Success: {
      jsonrpc: '2.0',
      id: 1,
      result: {
        version: 0,
        script_hash: '0x869575db91de0265118002f26e00fe1d4a89b9f0',
        frozen: false,
        votes: [],
        balances: [{
          asset: '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
          value: '1488.1'
        },
        {
          asset: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
          value: '186'
        }
        ]
      }
    }
  },
  getAssetState: {
    Success: {
      jsonrpc: '2.0',
      id: 1,
      result: {
        version: 0,
        id: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
        type: 'GoverningToken',
        name: [{
          lang: 'zh-CN',
          name: '\u5C0F\u8681\u80A1'
        }, {
          lang: 'en',
          name: 'AntShare'
        }],
        amount: '100000000',
        available: '100000000',
        precision: 0,
        owner: '00',
        admin: 'Abf2qMs1pzQb8kYk9RuxtUb9jtRKJVuBJt',
        issuer: 'Abf2qMs1pzQb8kYk9RuxtUb9jtRKJVuBJt',
        expiration: 4000000,
        frozen: false
      }
    }
  },
  validateAddress: {
    Success: {
      jsonrpc: '2.0',
      id: 1,
      result: {
        address: 'Adii5po62hCCS9s9upsK6bXdWJosjHBt4G',
        isvalid: true
      }
    }
  },
  getPeers: {
    Success: {
      jsonrpc: '2.0',
      id: 1,
      result: {
        unconnected: [],
        bad: [],
        connected: [
          { address: '::ffff:101.132.67.230', port: 20333 }
        ]
      }
    }
  },
  getContractState: {
    Success: {
      jsonrpc: '2.0',
      id: 1,
      result: {
        version: 0,
        hash: '0x5b7074e873973a6ed3708862f219a6fbf4d1c411',
        script: '... OMITTED ...',
        parameters: [ 'String', 'Array' ],
        returntype: 'ByteArray',
        storage: true,
        name: 'rpx',
        code_version: '3',
        author: '1',
        email: '1',
        description: '1'
      }
    }
  }
}
