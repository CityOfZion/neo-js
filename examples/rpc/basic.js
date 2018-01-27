#!/usr/bin/env node

/**
 * Basic RPC Example
 * A simple example to get started with neo-js's RPC client.
 */

// -- Bootstrap

const Node = require('../../dist/node')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc:basic', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Basic RPC Example ==')

  // Instantiate a node that provides access to the testnet mesh
  const node = new Node({ network: 'testnet' })

  // Verify neoBlockchain properties
  logger.info('node.domain:', node.domain)
  logger.info('node.network:', node.network)
  logger.info('node.mesh.nodes.length:', node.mesh.nodes.length)
  logger.info('list of nodes in the mesh:')
  node.mesh.nodes.forEach((node, index) => {
    logger.info(`> [${index}] ${node.domain}:${node.port}`)
  })

  // Example RPC requests
  logger.info('getBlockCount:', await node.mesh.rpc('getBlockCount'))
  logger.info('getBestBlockHash:', await node.mesh.rpc('getBestBlockHash'))

  logger.info('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
