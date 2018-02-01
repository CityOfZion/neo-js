#!/usr/bin/env node

/**
 * Blockchain Syncing Example
 *
 * An actual syncing usage to populate local running MongoDB server.
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:node:sync', { level: Logger.levels.INFO })
const Neon = require('@cityofzion/neon-js')

// -- Chain of command

async function main () {
  logger.info('== Regression Test on local node ==')

  // Instantiate a testnet node with local storage
  const options = {
    network: 'testnet',
    storageOptions: {
      model: 'mongoDB',
      dataAccessOptions: {
        connectOnInit: true,
        connectionString: 'mongodb://localhost/sync_demo3',
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
    // fetch local node height
    const localBlockHeight = await neo.storage.getBlockCount()
    // generate random number in between
    const randomHeight = parseInt(Math.random() * localBlockHeight)
    // logger.info('localBlockHeight:', localBlockHeight, 'randomHeight:', randomHeight)
    // fetch block from local node
    const localBlock = await neo.storage.getBlock(randomHeight)
    // logger.info('localBlock:', localBlock.hash)
    // fetch block from remote node via NodeJs
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
