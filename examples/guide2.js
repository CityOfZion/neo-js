#!/usr/bin/env node

// -- Bootstrap

const Rpc = require('../dist2/neo.blockchain.rpc')
const Neo = require('../dist2/neo.blockchain.neo')

// -- Use cases

async function neoDemo1 () {

}


async function neoDemo2 () {
  console.log('== Advanced Neo client initialisation ==')

  /**
   * Want to see more log messages for debugging purpose? Provide an verbose level.
   */
  const neoBlockchain = new Neo('testnet', { verboseLevel: 3 })


  console.log('getBlockCount:', await neoBlockchain.getBlockCount())

  console.log('')
}

/**
 * Full blockchain equivalant usage
 */
async function neoDemo3 () {
  console.log('== Full blockchain initialisation ==')
  const neoBlockchain = new Neo('testnet', { diagnosticInterval: 2000, verboseLevel: 3 })
  console.log('')
}

/**
 * Local node
 */
async function neoDemo4 () {
  console.log('== Full blockchain initialisation ==')
  const neoBlockchain = new Neo('testnet', { localNodeEnabled: true, verboseLevel: 3 })
  console.log('')
}

// -- Chain of command

async function main () {
  /**
   * Basic Neo client usages
   * 
   * Instantiate a Neo client by specific desire network either it's 'mainnet' or 'testnet'.
   * Upon its instantiation it will pick a default node. This can be changed later for purposes.
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
