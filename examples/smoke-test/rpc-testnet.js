#!/usr/bin/env node

/**
 * Basic Testnet RPC Test
 *
 * A simple example to get started with neo-js's RPC client.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc-testnet', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Basic Testnet RPC Test ==')

  // Instantiate a node that provides access to the testnet mesh
  const NETWORK = 'testnet'
  const neo = new Neo({ network: NETWORK })

  // Verify neo blockchain properties
  logger.info('neo.mesh.nodes.length:', neo.mesh.nodes.length)

  // Example RPC requests
  logger.info('getBlockCount:', await neo.mesh.rpc('getBlockCount'))
  logger.info('getBestBlockHash:', await neo.mesh.rpc('getBestBlockHash'))

  logger.info('== END ==')

  // neo blockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
