#!/usr/bin/env node

/**
 * Blockchain Syncing Example
 *
 * An actual syncing usage to populate local running MongoDB server.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:node:sync', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Test Syncing Example ==')

  // Instantiate a testnet node with local storage
  const options = {
    network: 'testnet',
    storageOptions: {
      model: 'mongoDB',
      dataAccessOptions: {
        connectOnInit: true,
        connectionString: 'mongodb://localhost/sync_demo3',
        collectionNames: {
          blocks: 'b_neo_t_blocks',
          transactions: 'b_neo_t_transactions',
          addresses: 'b_neo_t_addresses'
        }
      }
    }
  }

  // By initiating the Node class, the synchronization begins on its own.
  const neo = new Neo(options)
  logger.info('neo.network:', neo.network)

  // Check for current syncing progress every 30 seconds
  logger.info(`Start syncing...`)
  setInterval(async () => {
    logger.info(`current block count:`, await neo.storage.getBlockCount())
  }, 30000)

  // Check rankings
  setInterval(() => {
    const fastestNode = neo.mesh.getFastestNode()
    logger.info(`Fastest node: [${fastestNode.domain}:${fastestNode.port}] @ ${fastestNode.latency}`)
    const highestNode = neo.mesh.getHighestNode()
    logger.info(`Highest node: [${highestNode.domain}:${highestNode.port}] @ ${highestNode.blockHeight}`)
  }, 10000)
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
