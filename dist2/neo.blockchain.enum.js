/**
 * Choose JavaScript object instead of JSON to open possibility of logic operations or methods here.
 */
module.exports = {
  nodes: {
    mainnet: [
      { scheme: 'http', host: 'seed1.neo.org', port: 10332 },
      { scheme: 'http', host: 'seed2.neo.org', port: 10332 },
      { scheme: 'http', host: 'seed3.neo.org', port: 10332 },
      { scheme: 'http', host: 'seed4.neo.org', port: 10332 },
      { scheme: 'http', host: 'seed5.neo.org', port: 10332 },
      { scheme: 'http', host: 'seed8.antshares.org', port: 10332 },
      { scheme: 'http', host: 'api.otcgo.cn', port: 10332 },
      { scheme: 'http', host: 'seed1.cityofzion.io', port: 8080 },
      { scheme: 'http', host: 'seed2.cityofzion.io', port: 8080 },
      { scheme: 'http', host: 'seed3.cityofzion.io', port: 8080 },
      { scheme: 'http', host: 'seed4.cityofzion.io', port: 8080 },
      { scheme: 'http', host: 'seed5.cityofzion.io', port: 8080 }
    ],
    testnet: [
      { scheme: 'http', host: 'seed1.neo.org', port: 20332 },
      { scheme: 'http', host: 'seed2.neo.org', port: 20332 },
      { scheme: 'http', host: 'seed3.neo.org', port: 20332 },
      { scheme: 'http', host: 'seed4.neo.org', port: 20332 },
      { scheme: 'http', host: 'seed5.neo.org', port: 20332 },
      { scheme: 'http', host: 'seed8.antshares.org', port: 20332 },
      { scheme: 'http', host: 'api.otcgo.cn', port: 20332 },
      { scheme: 'http', host: 'test1.cityofzion.io', port: 8880 },
      { scheme: 'http', host: 'test2.cityofzion.io', port: 8880 },
      { scheme: 'http', host: 'test3.cityofzion.io', port: 8880 },
      { scheme: 'http', host: 'test4.cityofzion.io', port: 8880 },
      { scheme: 'http', host: 'test5.cityofzion.io', port: 8880 }
    ]
  },
  mongodb: {
    testnet: {
      server: 'localhost',
      database: 'lorem',
      collections: {
        blocks: 'b_neo_t_blocks', // The blockchain collection
        transactions: 'b_neo_t_transactions', // The transactions on the blockchains
        addresses: 'b_neo_t_addresses' // A collection maintaining accounts and their balances
      }
    },
    mainnet: {
      server: 'localhost',
      database: 'lorem',
      collections: {
        blocks: 'b_neo_m_blocks', // The blockchain collection
        transactions: 'b_neo_m_transactions', // The transactions on the blockchains
        addresses: 'b_neo_m_addresses' // A collection maintaining accounts and their balances
      }
    }
  }
}
