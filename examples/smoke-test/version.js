#!/usr/bin/env node

/**
 * Get Version Example
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:asset', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Get Version Example ==')

  logger.info('Neo Class Version:', Neo.VERSION)

  const neo = new Neo({
    network: 'testnet',
    loggerOptions: {
      level: Logger.levels.SILENT
    },
    storageOptions: {
      loggerOptions: {
        level: Logger.levels.SILENT
      }
    }
  })
  logger.info('Neo Instance Version:', neo.VERSION)

  logger.info('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Execute

main()
