module.exports = {
  getBalance: () => {
    return new Promise((resolve, reject) => {
      resolve({
        address: 'Adii5po62hCCS9s9upsK6bXdWJosjHBt4G',
        net: 'TestNet',
        assetSymbols: [ 'GAS', 'NEO' ],
        assets: {
          GAS: { balance: 988.1, spent: [], unspent: [Array], unconfirmed: [] },
          NEO: { balance: 86, spent: [], unspent: [Array], unconfirmed: [] }
        },
        tokenSymbols: [],
        tokens: {},
        GAS: {
          balance: 988.1,
          unspent: []
        },
        NEO: {
          balance: 86,
          unspent: []
        }
      })
    })
  },
  getClaims: () => {
    return new Promise((resolve, reject) => {
      resolve({
        address: 'Adii5po62hCCS9s9upsK6bXdWJosjHBt4G',
        claims: [
          {
            claim: 81432,
            end: 535882,
            index: 0,
            start: 535855,
            sysfee: 0,
            txid: 'b7d2ba866b5f51472bb29e5dc7cdcddca4f8453d4b8b9ba48ca4000426a92eca',
            value: 377
          },
          {
            claim: 185276650,
            end: 589399,
            index: 0,
            start: 535857,
            sysfee: 63114,
            txid: '8dcc069f27686a4e977f29af94eb024c1fc8ab25eb3e75cd7ac4b163478e6f75',
            value: 377
          }
        ],
        net: 'TestNet',
        total_claim: 475302700,
        total_unspent_claim: 182439673
      })
    })
  },
  getTransactionHistory: () => {
    return new Promise((resolve, reject) => {
      resolve([
        {
          GAS: -500,
          NEO: 0,
          block_index: 685143,
          gas_sent: true,
          neo_sent: false,
          txid: '1f9be34c2d1f5440c4fdd447365e491b56788fd6ddeadc73b77fb0ad1def0ef8'
        },
        {
          GAS: 0,
          NEO: -100,
          block_index: 685142,
          gas_sent: false,
          neo_sent: true,
          txid: '29089e83419d752cc9e59908c850fab680de804706b5b793a0a175fd3427b822'
        }
      ])
    })
  },
  getTokenBalance: () => {
    return new Promise((resolve, reject) => {
      resolve(0.0002)
    })
  },
  doSendAsset: () => {
    return new Promise((resolve, reject) => {
      resolve({
        jsonrpc: '2.0',
        id: 1234,
        result: true,
        txid: 'ec840d982f4dc5e0803f464c92d17e598814bd5317dd6036ae47a4b6bac12e9c'
      })
    })
  },
  doTransferToken: () => {
    return new Promise((resolve, reject) => {
      resolve({
        jsonrpc: '2.0',
        id: 1234,
        result: true,
        txid: {}
      })
    })
  },
  doClaimAllGas: () => {
    return new Promise((resolve, reject) => {
      resolve({
        jsonrpc: '2.0',
        id: 1234,
        result: true,
        txid: {
          type: 2,
          version: 0,
          attributes: [],
          inputs: [],
          outputs: [],
          scripts: [],
          claims: [
            {
              prevHash: 'ed93b787273c2d897344db43b3afa55d5295ca4a0890044b3723b4f0de0acc39',
              prevIndex: 0
            }
          ]
        }
      })
    })
  },
  doMintTokens: () => {
    return new Promise((resolve, reject) => {
      resolve({
        jsonrpc: '2.0',
        id: 1234,
        result: true
      })
    })
  }
}
