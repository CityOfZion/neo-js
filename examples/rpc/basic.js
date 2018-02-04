#!/usr/bin/env node

/**
 * Basic RPC Example
 * A simple example to get started with neo-js's RPC client.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc:basic', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Basic RPC Example ==')

  // Instantiate a node that provides access to the testnet mesh
  const neo = new Neo({ network: 'testnet' })

  // Verify neoBlockchain properties
  logger.info('neo.domain:', neo.domain)
  logger.info('neo.network:', neo.network)
  logger.info('neo.mesh.nodes.length:', neo.mesh.nodes.length)
  logger.info('list of nodes in the mesh:')
  neo.mesh.nodes.forEach((node, index) => {
    logger.info(`> [${index}] ${node.domain}:${node.port}`)
  })

  // Example RPC requests
  logger.info('getBlockCount:', await neo.mesh.rpc('getBlockCount'))
  logger.info('getBestBlockHash:', await neo.mesh.rpc('getBestBlockHash'))

  logger.info('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
