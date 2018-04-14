#!/usr/bin/env node

/**
 * Basic Privnet RPC Test
 *
 * A simple example to get started with neo-js's RPC client.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc-privnet', { level: Logger.levels.INFO })

process.on('unhandledRejection', (reason, p) => {
  console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// -- Implementation

;(async () => {
  logger.info('== Basic Privnet RPC Test ==')

  // Instantiate a node that provides access to the testnet mesh
  const NETWORK = {
    network: 'privnet',
    endpoints: [
      { domain: 'http://127.0.0.1', port: 30333 },
      { domain: 'http://127.0.0.1', port: 30334 },
      { domain: 'http://127.0.0.1', port: 30335 },
      { domain: 'http://127.0.0.1', port: 30336 }
    ]
  }
  const neo = new Neo({ network: NETWORK })

  // Verify neo blockchain properties
  logger.info('neo.mesh.nodes.length:', neo.mesh.nodes.length)

  // Example RPC requests
  logger.info('getBlockCount:', await neo.mesh.rpc('getBlockCount'))
  logger.info('getBestBlockHash:', await neo.mesh.rpc('getBestBlockHash'))

  logger.info('== END ==')

  // neo blockchain process in the background. Explicit exit call is used.
  process.exit()
})()
