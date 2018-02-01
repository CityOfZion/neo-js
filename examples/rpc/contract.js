#!/usr/bin/env node

/**
 * Contract RPC Example
 * A simple example to profile a contract via RPC client.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc:contract', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Contract RPC Example ==')

  // Instantiate a node to interact with the testnet mesh
  const neo = new Neo({ network: 'testnet' })

  // Example RPC requests
  const rpxHash = '0x5b7074e873973a6ed3708862f219a6fbf4d1c411' // RPX's hash value in testnet (which is different to mainnet)
  logger.info('getContractState:', await neo.mesh.rpc('getContractState', rpxHash))

  logger.info('== END ==')

  // node  process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
