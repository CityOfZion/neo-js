#!/usr/bin/env node

/**
 * Sync Test against Testnet
 *
 * An example usage to have a running node instance syncing in the background while
 * perform user tasks at foreground. Please make sure there is a local MongoDB server running.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:sync-testnet', { level: Logger.levels.INFO })

process.on('unhandledRejection', (reason, p) => {
  console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// -- Helper methods

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// -- Implementation

;(async () => {
  logger.info('== Sync Test against Testnet ==')

  // Instantiate a testnet node with specified local storage (and to a separate database as default of mongodb.js)
  const options = {
    network: 'testnet',
    storageOptions: {
      model: 'mongoDB',
      dataAccessOptions: {
        connectOnInit: true,
        connectionString: 'mongodb://localhost/sync_demo',
        collectionNames: {
          blocks: 'b_neo_t_blocks',
          transactions: 'b_neo_t_transactions',
          addresses: 'b_neo_t_addresses'
        }
      }
    }
  }
  const neo = new Neo(options)

  // Allow it to sync for 15 seconds
  logger.info('Start syncing for 15 seconds...')
  await sleep(15000)

  // Report document counts per collection type
  logger.info('block count:', await neo.storage.getBlockCount())

  const hash = await neo.storage.getBestBlockHash()
  logger.info('best block hash:', hash)

  const block = await neo.storage.getBlockByHash(hash)
  logger.info('best block:', block)

  const txid = block.tx[0].txid
  logger.info('a TX ID of the best block:', txid)

  const transaction = await neo.storage.getTX(txid)
  logger.info('transaction:', transaction)

  logger.info('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
})()
