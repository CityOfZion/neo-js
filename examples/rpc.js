#!/usr/bin/env node

const neoRpc = require('../dist/neo.blockchain.rpc')

// -- Bootstrap

let client = new neoRpc('testnet')
console.log('client:', client)

//-- Use Cases

async function lorem () {
  console.log('lorem:')
  console.log('currentSeed:', client.getCurrentSeed())
  console.log('currentSeedUrl:', client.getCurrentSeedUrl())
  console.log('bestBlockHash:', await client.getBestBlockHash())
}

// -- Chain of command

async function actionAsync () {
  // Examples
  await lorem()
  process.exit()
}

// Execute
actionAsync()
