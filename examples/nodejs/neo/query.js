#!/usr/bin/env node

/**
 * Read Local Node Example
 */

// -- Bootstrap

const mongoose = require('mongoose')

// -- Chain of command

async function main () {
  console.log('== Read Local Node Example ==')

  // Explicit promise class assignment (needed to avoid warning message)
  mongoose.Promise = global.Promise
  // Establish MongoDB connection with hardcoded connection string
  await mongoose.connect('mongodb://localhost/neo', { useMongoClient: true })

  // Drop all existing collections in database in order to start fresh
  console.log('existing collections:')
  const collectionsInfo = await mongoose.connection.db.listCollections().toArray()
  collectionsInfo.forEach(async (info, index) => {
    console.log(`> [${index}] ${info.name}`)
  })

  // Define dynamical schema and models
  const Thing = new mongoose.Schema({ any: {} })
  const BlockModel = mongoose.model('b_neo_t_blocks', Thing)
  const AddressModel = mongoose.model('b_neo_t_addresses', Thing)
  const TransactionModel = mongoose.model('b_neo_t_transactions', Thing)

  // Report document counts per collection type
  console.log('block count:', await BlockModel.count({}))
  console.log('address count:', await AddressModel.count({}))
  console.log('transaction count:', await TransactionModel.count({}))

  console.log('== END ==')
  process.exit()
}

// -- Helper methods

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// -- Execute

main()
