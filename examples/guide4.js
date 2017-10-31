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
   * Neo client 'full' mode usage
   * 
   * This example requires local persistent storage, default to MongoDB (developed in MongoDB 3.4.9).
   * 'diagnosticInterval' is not required if you not interested in Neo client picking the best node for you.
   * By accessing to RPC delegates, Neo client will first attempt to seek for data in local storage before communicates with RPC API.
   */
  console.log('== Neo client full mode usage ==')
  const neoBlockchain = new Neo('testnet', { mode: 'full', verboseLevel: 3 })
  console.log('getBlock:', await neoBlockchain.getBlock(100000))

  process.exit() // Since there'll be background process happening, you'll need to explicit terminate this script.
}

// -- Execute

main()
