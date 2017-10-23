#!/usr/bin/env node

// const Profiles  = require('../helpers/profiles')
const Neo = require('../dist2/neo.blockchain.neo')

// -- Bootstrap

const neoBlockchain = new Neo('testnet')

// -- Chain of command

async function actionAsync() {
  // console.log('neoBlockchain:', neoBlockchain)
  console.log('getCurrentNode:', neoBlockchain.getCurrentNode())
  console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl())
  process.exit()
}

// Execute
actionAsync()
