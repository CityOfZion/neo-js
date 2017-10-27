/**
 * Choose JavaScript object instead of JSON to open possibility of logic operations or methods here.
 */
module.exports = {
  nodes: {
    mainnet: [
      { url: 'http://seed1.neo.org', port: 10332 },
      { url: 'http://seed2.neo.org', port: 10332 },
      { url: 'http://seed3.neo.org', port: 10332 },
      { url: 'http://seed4.neo.org', port: 10332 },
      { url: 'http://seed5.neo.org', port: 10332 },
      { url: 'http://seed8.antshares.org', port: 10332 },
      { url: 'http://api.otcgo.cn', port: 10332 },
      { url: 'http://seed1.cityofzion.io', port: 8080 },
      { url: 'http://seed2.cityofzion.io', port: 8080 },
      { url: 'http://seed3.cityofzion.io', port: 8080 },
      { url: 'http://seed4.cityofzion.io', port: 8080 },
      { url: 'http://seed5.cityofzion.io', port: 8080 },
    ],
    testnet: [
      { url: 'http://seed1.neo.org', port: 20332 },
      { url: 'http://seed2.neo.org', port: 20332 },
      { url: 'http://seed3.neo.org', port: 20332 },
      { url: 'http://seed4.neo.org', port: 20332 },
      { url: 'http://seed5.neo.org', port: 20332 },
      { url: 'http://seed8.antshares.org', port: 20332 },
      { url: 'http://api.otcgo.cn', port: 20332 },
      { url: 'http://test1.cityofzion.io', port: 8880 },
      { url: 'http://test2.cityofzion.io', port: 8880 },
      { url: 'http://test3.cityofzion.io', port: 8880 },
      { url: 'http://test4.cityofzion.io', port: 8880 },
      { url: 'http://test5.cityofzion.io', port: 8880 },
    ]
  },
  mongodb: {
    mainnet: {
      server: 'localhost',
      databsae: 'lorem',
      collections: {
        blockchain: 'b_neo_t_blocks', // The blockchain collection
        transactions: 'b_neo_t_transactions', // The transactions on the blockchains
        addresses: 'b_neo_t_addresses' // A collection maintaining accounts and their balances    
      }
    },
    testnet: {
      server: 'localhost',
      databsae: 'lorem',
      collections: {
        blockchain: 'b_neo_m_blocks', // The blockchain collection
        transactions: 'b_neo_m_transactions', // The transactions on the blockchains
        addresses: 'b_neo_m_addresses' // A collection maintaining accounts and their balances    
      }
    }
  }
}