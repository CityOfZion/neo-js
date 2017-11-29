#!/usr/bin/env node

/**
 * Basic RPC Example
 * A simple example to get started with neo-js's RPC client.
 */

// -- Bootstrap

const Neo = require('../../../dist/node')

// -- Chain of command

async function main () {
  console.log('== Basic RPC Example ==')

  // Instantiate a node that provides access to the testnet mesh
  const node = new Neo({ network: { network: 'testnet' } })

  // Verify neoBlockchain properties
  console.log('node.domain:', node.domain)
  console.log('node.network.network:', node.network.network)
  console.log('node.mesh.nodes.length:', node.mesh.nodes.length)
  console.log('list of nodes in the mesh:')
  node.mesh.nodes.forEach((node, index) => {
    console.log(`> [${index}] ${node.domain}:${node.port}`)
  })

  // Example RPC requests
  console.log('getBlockCount:', await node.mesh.rpc('getBlockCount'))
  console.log('getBestBlockHash:', await node.mesh.rpc('getBestBlockHash'))

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
