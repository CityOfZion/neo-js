#!/usr/bin/env node

// -- Bootstrap

const Rpc = require('../dist2/neo.blockchain.rpc')
const Neo = require('../dist2/neo.blockchain.neo')

// -- Methods

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// -- Chain of command

async function main () {
  /**
   * Neo syncing mode
   * 
   * This example will attempt to download all blocks from Neo VM, effectively creating a local node.
   * Set a high 'verboseLevel' to see debugging information print out to console log.
   */
  console.log('== Neo syncing mode ==')
  const neoBlockchain = new Neo('testnet', { localNodeEnabled: true, verboseLevel: 3 })
  neoBlockchain.sync.start()
  await sleep(60000)
  neoBlockchain.sync.stop()

  process.exit() // Since there'll be background process happening, you'll need to explicit terminate this script.
}

// -- Execute

main()
