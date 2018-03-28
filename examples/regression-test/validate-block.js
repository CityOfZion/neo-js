#!/usr/bin/env node

/**
 * Regression Test - Block Validation
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:node:sync', { level: Logger.levels.INFO })
const Neon = require('@cityofzion/neon-js')

// -- Chain of command

async function main () {
  logger.info('== Regression Test - Block Validation ==')

  // Instantiate a node with local storage
  const NETWORK = 'testnet'
  const DB_CONNECTION_STRING = 'mongodb://localhost/testnet'
  const options = {
    network: NETWORK,
    storageOptions: {
      model: 'mongoDB',
      dataAccessOptions: {
        connectOnInit: true,
        connectionString: DB_CONNECTION_STRING,
        collectionNames: {
          blocks: 'b_neo_t_blocks',
          transactions: 'b_neo_t_transactions',
          addresses: 'b_neo_t_addresses'
        }
      }
    }
  }
  const neo = new Neo(options)

  // Instantiate RPC via NeonJS
  const url = 'http://seed2.neo.org:20332'
  const rpc = Neon.rpc.default.create.rpcClient(url)

  // Keep looking and cherrypick blocks, and examine them
  setInterval(async () => {
    // Fetch local node height
    const localBlockHeight = await neo.storage.getBlockCount()

    // Generate random number in between
    const randomHeight = parseInt(Math.random() * localBlockHeight)
    // logger.info('localBlockHeight:', localBlockHeight, 'randomHeight:', randomHeight)

    // Fetch block from local node
    const localBlock = await neo.storage.getBlock(randomHeight)
    // logger.info('localBlock:', localBlock.hash)

    // Fetch block from remote node via NodeJs
    const remoteBlock = await rpc.getBlock(randomHeight)
    // logger.info('remoteBlock:', remoteBlock.hash)

    let isGood = true
    if (!localBlock || !remoteBlock) {
      isGood = false
    } else if (localBlock.hash !== remoteBlock.hash) {
      isGood = false
    } else if (localBlock.tx.length !== remoteBlock.tx.length) {
      isGood = false
    }

    if (isGood) {
      logger.info(`block #${randomHeight} is good.`)
    } else {
      logger.info(`block #${randomHeight} is inconsistent with RPC !!!`)
    }
  }, 2000)
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
