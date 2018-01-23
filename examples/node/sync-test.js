#!/usr/bin/env node

/**
 * Syncing Test Run Example
 *
 * An example usage to have a running node instance syncing in the background while
 * perform user tasks at foreground. Please make sure there is a local MongoDB server running.
 */

// -- Bootstrap

const Node = require('../../dist/node')

// -- Chain of command

async function main () {
  console.log('== Test Syncing Example ==')

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
  console.log('Start syncing for 30 seconds...')
  await sleep(30000)

  // Report document counts per collection type
  console.log('block count:', await node.storage.getBlockCount())

  const hash = await node.storage.getBestBlockHash()
  console.log('best block hash:', hash)

  const block = await node.storage.getBlockByHash(hash)
  console.log('best block:', block)

  const txid = block.tx[0].txid
  console.log('a TX ID of the best block:', txid)

  const transaction = await node.storage.getTX(txid)
  console.log('transaction:', transaction)

  console.log('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Helper methods

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
