#!/usr/bin/env node

// const Profiles  = require('../helpers/profiles')
const Neo = require('../dist2/neo.blockchain.neo')

// -- Bootstrap

const neoBlockchain = new Neo('testnet')

// -- Chain of command

async function actionAsync() {
  // console.log('neoBlockchain:', neoBlockchain)
  // neoBlockchain.setFastestNode()
  neoBlockchain.setHighestNode()
  console.log('getCurrentNode:', neoBlockchain.getCurrentNode())
  // console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl())
  // console.log('nodes:', neoBlockchain.nodes)
  // neoBlockchain.findCurrentNode()

  console.log('== RPC within Neo ==')
  console.log('getBlockCount:', await neoBlockchain.rpc.getBlockCount())
  console.log('getCurrentNode:', neoBlockchain.getCurrentNode())
  process.exit()
}

// Execute
actionAsync()
