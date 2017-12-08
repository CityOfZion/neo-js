#!/usr/bin/env node

/**
 * Contract RPC Example
 * A simple example to profile a contract via RPC client.
 */

// -- Bootstrap

const Node = require('../../../dist/node')

// -- Chain of command

async function main () {
  console.log('== Contract RPC Example ==')

  // Instantiate a node to interact with the testnet mesh
  const node = new Node({ network: 'testnet' })

  // Example RPC requests
  const rpxHash = '0x5b7074e873973a6ed3708862f219a6fbf4d1c411' // RPX's hash value in testnet (which is different to mainnet)
  console.log('getContractState:', await node.mesh.rpc('getContractState', rpxHash))

  console.log('== END ==')

  // node  process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
