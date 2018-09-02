#!/usr/bin/env node

const Neo = require('../../dist/neo').Neo

process.on('unhandledRejection', (reason, p) => {
  console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// -- Parameters

const network = 'mainnet'
const dbConnectOnInit = true
const dbConnectionString = 'mongodb://localhost/neo_mainnet'
const blockCollectionName = 'blocks'

// -- Implementation

;(async () => {
  console.log('== MongoDB Example ==')
  const neo = new Neo({
    network: network,
    storageType: 'mongodb',
    storageOptions: {
      connectOnInit: dbConnectOnInit,
      connectionString: dbConnectionString,
      collectionNames: {
        blocks: blockCollectionName,
      },
      loggerOptions: { level: 'debug' },
    },
    meshOptions: {
      loggerOptions: { level: 'debug' },
    },
    apiOptions: {
      loggerOptions: { level: 'debug' },
    },
    loggerOptions: { level: 'debug' },
  })

  // Wait for mesh to be ready before start testing
  neo.mesh.on('ready', async () => {
    // console.log('=> blockCount:', await neo.api.getBlockCount())
    console.log('=> block #12:', await neo.api.getBlock(12))

    neo.close()
    console.log('=== THE END ===')
  })
})()
