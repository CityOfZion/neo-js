#!/usr/bin/env node

const neoRpc = require('../dist2/neo.blockchain.rpc')

// -- Bootstrap

// let client = new neoRpc('testnet')
let client = new neoRpc('http://seed1.neo.org:20332')
// console.log('client:', client)

//-- Use Cases

async function nodeProfiles () {
  console.log('== nodeProfiles: ==')
  // console.log('getCurrentNode:', client.getCurrentNode())
  // console.log('getCurrentNodeUrl:', client.getCurrentNodeUrl())
  console.log('bestBlockHash:', await client.getBestBlockHash())
  console.log('getBlockCount:', await client.getBlockCount())
}

// -- Chain of command

async function actionAsync () {
  /**
   * NOTES:
   * - RPC should have no concerns about available nodes and the need to switch between nodes.
   *   The RPC constructor should just take the url path, that's all it should cares.
   * - Want to change the node URL? either reinstantiate, or directly change the URL
   */
  await nodeProfiles()
  process.exit()
}

// Execute
actionAsync()
