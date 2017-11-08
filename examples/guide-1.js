#!/usr/bin/env node

// -- Bootstrap

const Rpc = require('../dist2/neo.blockchain.rpc')

// -- Chain of command

async function main () {
  /**
   * Basic JSON-RPC API usages
   * 
   * Direct RPC API connect by provide a valid ndoe URL.
   * Check out 'neo.blockchain.enum.js' to see list of available nodes for mainnet or testnet.
   */
  console.log('== Basic JSON-RPC API usages ==')
  const client = new Rpc('http://seed1.neo.org:20332')
  console.log('getBlockCount:', await client.getBlockCount())
  console.log('bestBlockHash:', await client.getBestBlockHash())
}

// -- Execute

main()
