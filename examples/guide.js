#!/usr/bin/env node

// -- Bootstrap

const Rpc = require('../dist2/neo.blockchain.rpc')
const Neo = require('../dist2/neo.blockchain.neo')

// -- Use cases

async function rpcDemo1 () {
  console.log('== Basic JSON-RPC API usages ==')
  /**
   * Instantiate a RPC client by provide a node URL. 
   * Check out 'neo.blockchain.enum.js' to see list of available nodes for mainnet or testnet.
   */
  const client = new Rpc('http://seed1.neo.org:20332')
  // console.log('defaults:', Rpc.Defaults)
  // console.log('options:', client.options)
  console.log('getBlockCount:', await client.getBlockCount())
  console.log('bestBlockHash:', await client.getBestBlockHash())
  console.log('')
}

async function neoDemo1 () {
  console.log('== Basic Neo client usages ==')
  /**
   * Instantiate a Neo client by specific desire network either it's 'mainnet' or 'testnet'.
   * Upon its instantiation it will pick a default node. This can be changed later for purposes.
   */
  const neoBlockchain = new Neo('testnet')
  console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl())
  /**
   * Making RPC request is the same as with a RPC client
   */
  console.log('getBlockCount:', await neoBlockchain.rpc.getBlockCount())
  /**
   * Explicitly seeking and pick a node with highest node count.
   * This example will not do anything as the required diagnostic is not performanced in order to get the required data.
   * As result, it'll pick a default node.
   */
  neoBlockchain.setHighestNode()
  console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl())
  console.log('getBlockCount:', await neoBlockchain.rpc.getBlockCount())

  console.log('')
}


async function neoDemo2 () {
  console.log('== Advanced Neo client initialisation ==')

  /**
   * Want to see more log messages for debugging purpose? Provide an verbose level.
   */
  const neoBlockchain = new Neo('testnet', { verboseLevel: 3 })

  /**
   * Now make a getBlockCount request where its event handler will log out debugging information.
   */
  console.log('getBlockCount:', await neoBlockchain.rpc.getBlockCount())

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

// -- Chain of command

async function main () {
  /**
   * Basic JSON-RPC API usages
   */
  await rpcDemo1()

  /**
   * Basic Neo client usages
   */
  // await neoDemo1()
  // await neoDemo2()
  // await neoDemo3()

  // process.exit()
}

// -- Execute

main()
