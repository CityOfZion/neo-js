#!/usr/bin/env node

// -- Bootstrap

const Rpc = require('../dist2/neo.blockchain.rpc')
const Neo = require('../dist2/neo.blockchain.neo')

// -- Chain of command

async function main () {
  /**
   * Basic JSON-RPC API usages
   */
  console.log('== Basic JSON-RPC API usages ==')
  const client = new Rpc('http://seed1.neo.org:20332') // Instantiate a RPC client by provide a node URL. Check out 'neo.blockchain.enum.js' to see list of available nodes for mainnet or testnet.
  console.log('getBlockCount:', await client.getBlockCount())
  console.log('bestBlockHash:', await client.getBestBlockHash())
  console.log('')

  /**
   * Basic Neo client usages
   */
  console.log('== Basic Neo client usages ==')  
  const neoBlockchain = new Neo('testnet') // Instantiate a Neo client by specific desire network either it's 'mainnet' or 'testnet'
  console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl())
  console.log('')

  process.exit()
}

// -- Execute

main()
