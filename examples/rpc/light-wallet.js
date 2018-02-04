#!/usr/bin/env node

/**
 * Light Wallet Example
 * A simple example to show the light wallet's read abilities.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc:light-wallet', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Light Wallet Example ==')

  // Instantiate a node that provides access to the testnet mesh
  const neo = new Neo({ network: 'testnet' })

  // Access wallet info
  logger.info('neo.wallet.getBalance:', await neo.wallet.getBalance('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))
  logger.info('neo.wallet.getClaims:', await neo.wallet.getClaims('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))
  logger.info('neo.wallet.getTransactionHistory:', await neo.wallet.getTransactionHistory('AG3p13w3b1PT7UZtsYBoQrt6yjjNhPNK8b'))

  logger.info('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
