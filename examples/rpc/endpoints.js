#!/usr/bin/env node

/**
 * Verify every available RPC endpoints
 */

// -- Bootstrap

const Node = require('../../dist/node')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc:endpoints', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Basic RPC Example ==')

  /**
   * Instantiate a node that either connect to 'netnet', 'mainnet' or specified RPC endpoints.
   */
  // const node = new Node({ network: 'testnet' })
  // const node = new Node({ network: 'mainnet' })
  const node = new Node({ network: {
    endpoints: [
      { domain: 'http://seed2.neo.org', port: 10332 },
      { domain: 'http://seed1.cityofzion.io', port: 8080 }
    ]
  }})

  // Test connection by verify block count of every RPC endpoints
  await Promise.all(node.mesh.nodes.map(async (node) => {
    logger.info(`> ${node.domain}:${node.port} block count:`, await node.rpc.getBlockCount())
  }))

  logger.info('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
