#!/usr/bin/env node

/**
 * Get Version Example
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:asset', { level: Logger.levels.INFO })

// -- Implementation

;(async () => {
  logger.info('== Get Version Example ==')

  // Fetch Neo class version without instantiating it
  logger.info('Neo Class Version:', Neo.VERSION)

  // Instantiate
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
  // Fetch Neo version from its instance
  logger.info('Neo Instance Version:', neo.VERSION)

  logger.info('== END ==')
  process.exit() // neo process in the background. Explicit exit call is needed.
})()
