#!/usr/bin/env node

/**
 * Basic RPC Example
 * A simple example to get started with neo-js's RPC client.
 */

// -- Bootstrap

const Neo = require('../../../dist/neo.blockchain.neo').neo

// -- Chain of command

async function main () {
  console.log('== Basic RPC Example ==')

  // Instantiate a 'light' mode Neo blockchain against 'testnet' network
  const neoBlockchain = new Neo('light', 'testnet')

  // Verify neoBlockchain properties
  console.log('neoBlockchain.mode:', neoBlockchain.mode)
  console.log('neoBlockchain.network:', neoBlockchain.network)
  console.log('neoBlockchain.nodes.length:', neoBlockchain.nodes.length)
  console.log('list of potential nodes:')
  neoBlockchain.nodes.forEach((node, index) => {
    console.log(`> [${index}] ${node.domain}:${node.port}`)
  })

  // Since you cannot analyse status of each node in 'light' mode, this example will pick the first potential node for RPC interaction.
  const node = neoBlockchain.nodes[0]
  console.log(`Selected node: ${node.domain}:${node.port}`)

  // Example RPC requests
  console.log('getBlockCount:', await node.rpc.getBlockCount())
  console.log('getBestBlockHash:', await node.rpc.getBestBlockHash())

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
