#!/usr/bin/env node

/**
 * Light Wallet Example
 * A simple example to show the light wallet's read abilities.
 */

// -- Bootstrap

const Node = require('../../../dist/node')

// -- Chain of command

async function main () {
  console.log('== Light Wallet Example ==')

  // Instantiate a node that provides access to the testnet mesh
  const node = new Node({ network: 'testnet' })

  // Access wallet info
  console.log('node.wallet.getBalance:', await node.wallet.getBalance('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))
  console.log('node.wallet.getClaims:', await node.wallet.getClaims('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))
  console.log('node.wallet.getTransactionHistory:', await node.wallet.getTransactionHistory('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
