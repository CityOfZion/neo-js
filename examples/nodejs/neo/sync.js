#!/usr/bin/env node

/**
 * NeoBlockchain Syncing Example
 *
 * An example usage to have a running NeoBlockchain instance syncing in the background while perform user tasks 
 * at foreground. Please make sure there is a local MongoDB server running.
 *
 * To verify stored data, this example will interact with MongoDB collections directly using mongoose library.
 */

// -- Bootstrap

const Neo = require('../../../dist/neo.blockchain.neo').neo

// -- Chain of command

async function main () {
  console.log('== NeoBlockchain Syncing Example ==')

  // Instantiate a 'full' mode Neo blockchain against 'testnet' network
  const neoBlockchain = new Neo('full', 'testnet')

  // Allow it to sync for 30 seconds
  neoBlockchain.sync.start()
  await sleep(30000)
  neoBlockchain.sync.stop()

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Helper methods

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// -- Execute

main()
