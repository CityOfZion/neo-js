#!/usr/bin/env node

/**
 * MongoDB Connectivity Test
 *
 * A simple test to verify if Neo instance able to establish connection with MongoDB.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:mongodb', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== MongoDB Connectivity Test ==')
  const neo = await new Neo({ // eslint-disable-line no-unused-vars
    network: 'testnet',
    storageOptions: {
      model: 'mongoDB',
      dataAccessOptions: {
        loggerOptions: {
          level: 'info'
        }
      }
    }
  })
  /**
   * If MongoDB server is not available for some reason, you should see similar error message:
   * 'failed to connect to server [localhost:27017] on first connect [MongoError: connect ECONNREFUSED 127.0.0.1:27017]'
   *
   * If MongoDB connection works, you should see an 'info' log from MongodbStorage:
   * 'mongoose connected.'
   */
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
