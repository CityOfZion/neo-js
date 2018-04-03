#!/usr/bin/env node

/**
 * Get Block Count Example
 *
 * As per example on README.md
 */

// -- Bootstrap

const Neo = require('../../dist/neo')

// -- Chain of command

async function main () {
  console.log('== Get Block Count Example ==')

  const options = {
    network: 'testnet',
    storageOptions: {
      model: 'mongoDB'
    }
  }

  const neo = new Neo(options)

  setTimeout(() => {
    neo.storage.getBlockCount()
      .then((res) => console.log('Block count:', res))
  }, 5000)
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
