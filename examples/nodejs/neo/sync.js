#!/usr/bin/env node

/**
 * NeoBlockchain Syncing Example
 *
 * An example usage to have a running NeoBlockchain instance syncing in the background while perform user tasks 
 * at foreground. Please make sure there is a local MongoDB server running.
 *
 * To verify stored data, this example will interact with MongoDB collections directly using mongoose library.
 */

// -- Bootstrap

const Neo = require('../../../dist/neo.blockchain.neo').neo
const mongoose = require('mongoose')

// -- Chain of command

async function main () {
  console.log('== NeoBlockchain Syncing Example ==')

  // Instantiate a 'full' mode Neo blockchain against 'testnet' network
  const neoBlockchain = new Neo('full', 'testnet')

  // Explicit promise class assignment (needed to avoid warning message)
  mongoose.Promise = global.Promise
  // Establish MongoDB connection with hardcoded connection string
  await mongoose.connect('mongodb://localhost/neo', { useMongoClient: true })

  // Drop all existing collections in database in order to start fresh
  console.log('existing collections:')
  const collectionsInfo = await mongoose.connection.db.listCollections().toArray()
  collectionsInfo.forEach(async (info, index) => {
    console.log(`> dropping [${index}] [${info.name}] collection...`)
    await mongoose.connection.db.dropCollection(info.name)
  })

  // Allow it to sync for 30 seconds
  console.log('Start syncing...')
  neoBlockchain.sync.start()
  await sleep(30000)
  neoBlockchain.sync.stop()
  console.log('Stop syncing...')

  // TODO: browse collections, analysed what's been stored from blockchain sync

  console.log('== END ==')

  // neoBlockchain process in the background. Explicit exit call is used.
  process.exit()
}

// -- Helper methods

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// -- Execute

main()
