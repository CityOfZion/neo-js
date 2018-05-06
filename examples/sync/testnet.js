#!/usr/bin/env node

/**
 * Syncing for Testnet
 *
 * An actual syncing usage to populate local running MongoDB server.
 */

// -- Bootstrap

const moment = require('moment')
const math = require('mathjs')
const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:sync:testnet', { level: 'info' })

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// -- Implementation

;(async () => {
  logger.info('== Syncing for Testnet ==')

  const NETWORK = 'testnet'
  const DB_CONNECTION_STRING = 'mongodb://localhost/testnet'
  const options = {
    network: NETWORK,
    storageOptions: {
      model: 'mongoDB',
      dataAccessOptions: {
        connectOnInit: true,
        connectionString: DB_CONNECTION_STRING,
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

  // Check nodes rankings
  setInterval(() => {
    const fastestNode = neo.mesh.getFastestNode()
    logger.info(`Fastest node: [${fastestNode.domain}:${fastestNode.port}] @ ${fastestNode.latency}`)
    const highestNode = neo.mesh.getHighestNode()
    logger.info(`Highest node: [${highestNode.domain}:${highestNode.port}] @ ${highestNode.blockHeight}`)
  }, 30000)

  // Live Report
  const report = {
    success: [],
    failed: [],
    max: undefined,
    startDate: moment()
  }
  neo.on('storeBlock:complete', (payload) => {
    report.max = payload.max // Keep updating property in case it changes
    if (payload.isSuccess) {
      report.success.push({
        index: payload.index,
        date: moment()
      })
    } else {
      report.failed.push({
        index: payload.index,
        date: moment()
      })
    }
  })
  setInterval(() => { // Generate report every 5 seconds
    if (report.success.length > 0) {
      const msElapsed = moment().diff(report.startDate)
      const successBlockCount = report.success.length
      const highestBlock = report.success[report.success.length - 1].index // This is an guesstimate
      const completionPercentage = math.round((highestBlock / report.max * 100), 4)
      const blockCountPerMinute = math.round((successBlockCount / msElapsed * 1000 * 60), 0)
      logger.info(`Blocks synced: ${successBlockCount} (${completionPercentage}% complete) - ${blockCountPerMinute} blocks/minute`)
    } else {
      logger.info('No sync progress yet...')
    }
  }, 5000)
})()
