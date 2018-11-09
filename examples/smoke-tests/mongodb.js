#!/usr/bin/env node

const Neo = require('../../dist/neo').Neo

process.on('unhandledRejection', (reason, p) => {
  console.warn('Unhandled promise rejection. Reason:', reason)
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
      loggerOptions: { level: 'info' },
    },
    apiOptions: {
      loggerOptions: { level: 'info' },
    },
    syncerOptions: {
      startOnInit: false,
      loggerOptions: { level: 'info' },
    },
    loggerOptions: { level: 'info' },
  })

  neo.storage.on('ready', async () => {
    console.log('=> neo.storage ready.')
    const blocks = await neo.storage.getBlocks(517622)
    console.log('=> Blocks of height 517622:', blocks)

    const redundancyCount = await neo.storage.countBlockRedundancy(517622)
    console.log('redundancyCount:', redundancyCount)

    neo.close()
    console.log('=== THE END ===')
  })
})()
