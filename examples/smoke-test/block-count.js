#!/usr/bin/env node

/**
 * Get Block Count Example
 *
 * As per example on README.md
 */

// -- Bootstrap

const Neo = require('../../dist/neo')

process.on('unhandledRejection', (reason, p) => {
  console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// -- Implementation

;(async () => {
  console.log('== Get Block Count Example ==')

  const options = {
    network: 'testnet',
    storageOptions: {
      model: 'mongoDB'
    }
  }
  const neo = new Neo(options)

  neo.storage.getBlockCount()
    .then((res) => {
      console.log('Block count:', res)
      console.log('== END ==')
      process.exit()
    })
})()
