#!/usr/bin/env node

/**
 * Light Wallet Example
 * A simple example to show the light wallet's read abilities.
 */

// -- Bootstrap

const Node = require('../../dist/node')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc:light-wallet', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Light Wallet Example ==')

  // Instantiate a node that provides access to the testnet mesh
  const node = new Node({ network: 'testnet' })

  // Access wallet info
  logger.info('node.wallet.getBalance:', await node.wallet.getBalance('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))
  logger.info('node.wallet.getClaims:', await node.wallet.getClaims('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))
  logger.info('node.wallet.getTransactionHistory:', await node.wallet.getTransactionHistory('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))

  logger.info('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
