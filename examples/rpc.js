#!/usr/bin/env node

const neoRpc = require('../dist2/neo.blockchain.rpc')

// -- Bootstrap

let client = new neoRpc('testnet')
// console.log('client:', client)

//-- Use Cases

async function basic () {
  console.log('basic:')
  console.log('getCurrentNode:', client.getCurrentNode())
  console.log('getCurrentNodeUrl:', client.getCurrentNodeUrl())
  console.log('bestBlockHash:', await client.getBestBlockHash())
}

// -- Chain of command

async function actionAsync () {
  // Examples
  await basic()
  process.exit()
}

// Execute
actionAsync()
