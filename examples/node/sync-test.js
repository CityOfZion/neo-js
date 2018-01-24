#!/usr/bin/env node

/**
 * Syncing Test Run Example
 *
 * An example usage to have a running node instance syncing in the background while
 * perform user tasks at foreground. Please make sure there is a local MongoDB server running.
 */

// -- Bootstrap

const Node = require('../../dist/node')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:node:sync-test', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Test Syncing Example ==')

  // Instantiate a testnet node with specified local storage (and to a separate database as default of mongodb.js)
  const options = {
    network: 'testnet',
    storage: {
      model: 'mongoDB',
      connectOnInit: true,
      connectionString: 'mongodb://localhost/sync_demo',
      collectionNames: {
        blocks: 'b_neo_t_blocks',
        transactions: 'b_neo_t_transactions',
        addresses: 'b_neo_t_addresses'
      }
    }
  }
  const node = new Node(options)

  // Allow it to sync for 30 seconds
  logger.info('Start syncing for 30 seconds...')
  await sleep(30000)

  // Report document counts per collection type
  logger.info('block count:', await node.storage.getBlockCount())

  const hash = await node.storage.getBestBlockHash()
  logger.info('best block hash:', hash)

  const block = await node.storage.getBlockByHash(hash)
  logger.info('best block:', block)

  const txid = block.tx[0].txid
  logger.info('a TX ID of the best block:', txid)

  const transaction = await node.storage.getTX(txid)
  logger.info('transaction:', transaction)

  logger.info('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Helper methods

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
