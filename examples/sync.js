#!/usr/bin/env node

// const Profiles  = require('../helpers/profiles')
const neo = require('../dist/neo.blockchain.neo').neo
// let neoNode = undefined

// -- Bootstrap

/**
 * Initialise a blockchain instance of specified mode and network type.
 */
const mode = 'full' // Options: light, full
const network = 'testnet' // Options: testnet, mainnet
const neoBlockchain = new neo(mode, network)

neoBlockchain.sync.start()
