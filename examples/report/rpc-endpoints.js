#!/usr/bin/env node

/**
 * RPC Endpoint Connectivity Report
 *
 * Verify every available RPC endpoints.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:rpc-endpoints', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== RPC Endpoint Connectivity Report ==')

  /**
   * Instantiate a node that either connect to 'netnet', 'mainnet' or specified RPC endpoints.
   */
  // const neo = new Neo({ network: 'testnet' })
  // const neo = new Neo({ network: 'mainnet' })

  console.log('TestNet:')
  const testnetNeo = new Neo({
    network: 'testnet',
    loggerOptions: {
      level: Logger.levels.SILENT
    },
    storageOptions: {
      loggerOptions: {
        level: Logger.levels.SILENT
      }
    }
  })

  // Test connection by verify block count of every RPC endpoints
  await Promise.all(testnetNeo.mesh.nodes.map(async (node) => {
    try {
      let version = 'unknown'
      try {
        version = (await node.rpc.getVersion()).useragent
      } catch (ex) {}
      const blockCount = await node.rpc.getBlockCount()
      logger.info(`> ${node.domain}:${node.port} version: [${version}] height: [${blockCount}]`)
    } catch (ex) {
      logger.info(`> ${node.domain}:${node.port} error:`, ex.message)
    }
  }))

  console.log('MainNet:')
  const mainnetNeo = new Neo({
    network: 'mainnet',
    loggerOptions: {
      level: Logger.levels.SILENT
    },
    storageOptions: {
      loggerOptions: {
        level: Logger.levels.SILENT
      }
    }
  })

  // Test connection by verify block count of every RPC endpoints
  await Promise.all(mainnetNeo.mesh.nodes.map(async (node) => {
    try {
      let version = 'legacy version'
      try {
        version = (await node.rpc.getVersion()).useragent
      } catch (ex) { }
      const blockCount = await node.rpc.getBlockCount()
      logger.info(`> ${node.domain}:${node.port} version: [${version}] height: [${blockCount}]`)
    } catch (ex) {
      logger.info(`> ${node.domain}:${node.port} error:`, ex.message)
    }
  }))

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Execute

main()
