const profiles = {
  rpc: {
    mainnet: {
      endpoints: [
        { domain: 'http://seed1.neo.org', port: 10332 },
        { domain: 'http://seed2.neo.org', port: 10332 },
        { domain: 'http://seed3.neo.org', port: 10332 },
        { domain: 'http://seed4.neo.org', port: 10332 },
        { domain: 'http://seed5.neo.org', port: 10332 },
        { domain: 'http://seed1.cityofzion.io', port: 8080 },
        { domain: 'http://seed2.cityofzion.io', port: 8080 },
        { domain: 'http://seed3.cityofzion.io', port: 8080 },
        { domain: 'http://seed4.cityofzion.io', port: 8080 },
        { domain: 'http://seed5.cityofzion.io', port: 8080 }
      ]
    },
    testnet: {
      endpoints: [
        // { domain: 'http://seed1.neo.org', port: 20332 },
        { domain: 'http://seed2.neo.org', port: 20332 },
        { domain: 'http://seed3.neo.org', port: 20332 },
        { domain: 'http://seed4.neo.org', port: 20332 },
        { domain: 'http://seed5.neo.org', port: 20332 },
        { domain: 'http://test1.cityofzion.io', port: 8880 },
        { domain: 'http://test2.cityofzion.io', port: 8880 },
        { domain: 'http://test3.cityofzion.io', port: 8880 },
        { domain: 'http://test4.cityofzion.io', port: 8880 },
        { domain: 'http://test5.cityofzion.io', port: 8880 }
      ]
    }
  }
}

module.exports = profiles
