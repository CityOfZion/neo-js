#!/usr/bin/env node

/**
 * Verify every available RPC endpoints
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc:endpoints', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Basic RPC Example ==')

  /**
   * Instantiate a node that either connect to 'netnet', 'mainnet' or specified RPC endpoints.
   */
  // const neo = new Neo({ network: 'testnet' })
  // const neo = new Neo({ network: 'mainnet' })

  console.log('TestNet:')
  const testnetNeo = new Neo({ network: {
    endpoints: [
      { domain: 'http://seed1.neo.org', port: 20332 },
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
  }})

  // Test connection by verify block count of every RPC endpoints
  await Promise.all(testnetNeo.mesh.nodes.map(async (node) => {
    try {
      const blockCount = await node.rpc.getBlockCount()
      logger.info(`> ${node.domain}:${node.port} block count:`, blockCount)
    } catch (ex) {
      logger.info(`> ${node.domain}:${node.port} error:`, ex.message)
    }
  }))

  console.log('MainNet:')
  const mainnetNeo = new Neo({ network: {
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
  }})

  // Test connection by verify block count of every RPC endpoints
  await Promise.all(mainnetNeo.mesh.nodes.map(async (node) => {
    try {
      const blockCount = await node.rpc.getBlockCount()
      logger.info(`> ${node.domain}:${node.port} block count:`, blockCount)
    } catch (ex) {
      logger.info(`> ${node.domain}:${node.port} error:`, ex.message)
    }
  }))

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
