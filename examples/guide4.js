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
   * Neo client full mode usage
   */
  console.log('== Neo client full mode usage ==')
  const neoBlockchain = new Neo('testnet', { mode: 'full', verboseLevel: 3 }) // The blockchain instance will be disgnosing a node every 1000ms.
  console.log('getBlock:', await neoBlockchain.getBlock(100000))

  process.exit() // Since there'll be background process happening, you'll need to explicit terminate this script.
}

// -- Execute

main()
