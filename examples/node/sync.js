#!/usr/bin/env node

/**
 * Blockchain Syncing Example
 *
 * An actual syncing usage to populate local running MongoDB server.
 */

// -- Bootstrap

const Node = require('../../dist/node')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:node:sync', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Test Syncing Example ==')

  // Instantiate a testnet node with local storage
  const options = {
    network: 'testnet',
    storage: {
      model: 'mongoDB'
    }
  }

  // By initiating the Node class, the synchronization begins on its own.
  const node = new Node(options)
  logger.info('node.network:', node.network)

  // Check for current syncing progress every 30 seconds
  logger.info(`Start syncing...`)
  setInterval(async () => {
    logger.info(`current block count:`, await node.storage.getBlockCount())
  }, 30000)
}

// -- Execute

main()
