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
   */
  console.log('== Neo syncing mode ==')
  const neoBlockchain = new Neo('testnet', { mode: 'full', verboseLevel: 3 })
  neoBlockchain.startSync()
  await sleep(10000)
  neoBlockchain.stopSync()

  process.exit() // Since there'll be background process happening, you'll need to explicit terminate this script.
}

// -- Execute

main()
