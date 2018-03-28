#!/usr/bin/env node

/**
 * Syncing for Privnet
 *
 * An actual syncing usage to populate local running MongoDB server.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:sync:privnet', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Syncing for Privnet ==')

  const NETWORK = {
    network: 'privnet',
    endpoints: [
      { domain: 'http://127.0.0.1', port: 30333 },
      { domain: 'http://127.0.0.1', port: 30334 },
      { domain: 'http://127.0.0.1', port: 30335 },
      { domain: 'http://127.0.0.1', port: 30336 }
    ]
  }
  const DB_CONNECTION_STRING = 'mongodb://localhost/testnet'
  const options = {
    network: NETWORK,
    loggerOptions: {
      level: 'debug'
    },
    meshOptions: {
      loggerOptions: {
        level: 'debug'
      }
    },
    storageOptions: {
      model: 'mongoDB',
      loggerOptions: {
        level: 'debug'
      },
      dataAccessOptions: {
        connectOnInit: true,
        connectionString: DB_CONNECTION_STRING,
        collectionNames: {
          blocks: 'b_neo_p_blocks',
          transactions: 'b_neo_p_transactions',
          addresses: 'b_neo_p_addresses'
        },
        loggerOptions: {
          level: 'debug'
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
