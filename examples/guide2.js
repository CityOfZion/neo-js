#!/usr/bin/env node

// -- Bootstrap

const Neo = require('../dist2/neo.blockchain.neo')

// -- Chain of command

async function main () {
  /**
   * Basic Neo client usages
   * 
   * Instantiate a Neo client by specific desire network either it's 'mainnet' or 'testnet'.
   * Upon its instantiation it will pick a default node. This can be changed later for purposes.
   * You may access to RPC endpoints from Neo client which itself will choose the best RPC node for you.
   */
  console.log('== Basic Neo client usages ==')
  const neoBlockchain = new Neo('testnet') // either be 'testnet' or 'mainnet'
  console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl()) // A default node is picked upon initialisation
  console.log('getBlockCount:', await neoBlockchain.getBlockCount()) // Blockchain instance provide RPC endpoint delegates (to be coated with additional features later)
  neoBlockchain.setHighestNode() // You may explicitly seeking and pick a node with highest node count.
  neoBlockchain.setFastestNode() // Alternative, seek for node with the lowest latency
  console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl()) // Current node shouldn't change in this example as you lack of procedures in order to benchmark nodes.
}

// -- Execute

main()
