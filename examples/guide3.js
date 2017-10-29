#!/usr/bin/env node

// -- Bootstrap

const Rpc = require('../dist2/neo.blockchain.rpc')
const Neo = require('../dist2/neo.blockchain.neo')

// -- Methods

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// -- Chain of command

async function main () {
  /**
   * Neo client usages with benchmarking (previously known as 'full' mode)
   */
  console.log('== Neo client usages with benchmarking ==')
  const neoBlockchain = new Neo('testnet', { diagnosticInterval: 1000 }) // The blockchain instance will be disgnosing a node every 1000ms.
  console.log('getCurrentNodeUrl:', neoBlockchain.getCurrentNodeUrl()) // Show default node
  console.log('give it 10 seconds to gather diagnostic information...')
  await sleep(10000)
  const fNode = neoBlockchain.getFastestNode()
  console.log('Fastest node:', fNode.url, 'latency:', fNode.latency)
  const hNode = neoBlockchain.getHighestNode()
  console.log('Highest node:', hNode.url, 'blockHeight:', hNode.blockHeight)
  console.log('give it another 10 seconds to see if any changes in rankings...')
  await sleep(10000)
  const fNode2 = neoBlockchain.getFastestNode()
  console.log('Fastest node:', fNode2.url, 'latency:', fNode2.latency)
  const hNode2 = neoBlockchain.getHighestNode()
  console.log('Highest node:', hNode2.url, 'blockHeight:', hNode2.blockHeight)
  process.exit() // Since there'll be background process happening, you'll need to explicit terminate this script.
}

// -- Execute

main()
