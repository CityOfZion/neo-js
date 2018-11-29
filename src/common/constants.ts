const C = {
  network: {
    testnet: 'testnet',
    mainnet: 'mainnet',
  },
  storage: {
    memory: 'memory',
    mongodb: 'mongodb',
  },
  rpc: {
    getblock: 'getblock',
    getblockcount: 'getblockcount',
    getversion: 'getversion',
  },
  transaction: {
    MinerTransaction: 'MinerTransaction',
    ContractTransaction: 'ContractTransaction',
    InvocationTransaction: 'InvocationTransaction',
    ClaimTransaction: 'ClaimTransaction',
  }
}

export default C
