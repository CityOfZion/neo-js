#!/usr/bin/env node

/**
 * NeoBlockchain Syncing Example
 *
 * An example usage to have a running NeoBlockchain instance syncing in the background while 
 * perform user tasks at foreground. Please make sure there is a local MongoDB server running.
 *
 * To verify stored data, this example will interact with MongoDB collections directly using 
 * mongoose library.
 * 
 * WARNING: This demo will result in reset of data of specified database.
 */

// -- Bootstrap

const Neo = require('../../../dist/neo.blockchain.neo').neo
const mongoose = require('mongoose')

// -- Chain of command

async function main () {
  console.log('== NeoBlockchain Syncing Example ==')

  // Instantiate a 'full' mode Neo blockchain against 'testnet' network
  const neoBlockchain = new Neo('full', 'testnet')

  // Verify and establish MongoDB connection with hard coded connection string
  try {
    await mongoose.connect('mongodb://localhost/sync_demo', { useMongoClient: true })
  } catch (err) {
    console.error('Failed to establish MongoDB connection. err:', err)
    console.log('Exiting...')
    process.exit()
  }

  // Drop all existing collections in database in order to start fresh
  console.log('existing collections:')
  const collectionsInfo = await mongoose.connection.db.listCollections().toArray()
  collectionsInfo.forEach(async (info) => {
    console.log(`> dropping [${info.name}] collection...`)
    await mongoose.connection.db.dropCollection(info.name)
  })

  // Allow it to sync for 30 seconds
  console.log('Start syncing for 30 seconds...')
  neoBlockchain.sync.start()
  await sleep(30000)
  neoBlockchain.sync.stop()
  console.log('Stop syncing')

  // Refer to already defined models (defined in 'mongodb.js')
  const BlockModel = mongoose.model('b_neo_t_blocks')
  const AddressModel = mongoose.model('b_neo_t_addresses')
  const TransactionModel = mongoose.model('b_neo_t_transactions')

  // Report document counts per collection type
  console.log('block count:', await BlockModel.count({}))
  console.log('address count:', await AddressModel.count({}))
  console.log('transaction count:', await TransactionModel.count({}))

  // Cherry pick a block, address and transaction document
  // User is expected to find block index '5953' within the first 30 seconds of synchronization
  const cherryBlock = await BlockModel.findOne({ index: 5953 })
  console.log('cherryBlock, index:', cherryBlock.index, 'hash:', cherryBlock.hash, 'tx.length:', cherryBlock.tx.length)
  const cherryTransaction = await TransactionModel.findOne({ txid: '0x0198c35d32a8b50e5a4ec4923efc7e74f7ec5a1323eae395ae8331aea80da5ff' })
  console.log('cherryTransaction, txid:', cherryTransaction.txid, 'blockIndex:', cherryTransaction.blockIndex, 'type:', cherryTransaction.type)
  const cherryAddress = await AddressModel.findOne({ address: '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7'})
  console.log('cherryAddress, address:', cherryAddress.address, 'asset:', cherryAddress.asset)

  console.log('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Helper methods

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// -- Execute

main()
