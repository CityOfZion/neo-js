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

  // Since you cannot analyse status of each node in 'light' mode, this example will pick the first potential node for RPC interaction.
  const node = neoBlockchain.nodes[0]

  // Example RPC requests
  const rpxHash = '0x5b7074e873973a6ed3708862f219a6fbf4d1c411' // RPX's hash value in testnet (which is different to mainnet)
  console.log('getContractState:', await node.rpc.getContractState(rpxHash))

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
