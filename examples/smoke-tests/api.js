#!/usr/bin/env node

const Neo = require('../../dist/neo').Neo

process.on('unhandledRejection', (reason, p) => {
  console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// -- Parameters

const network = 'mainnet'

// -- Implementation

;(async () => {
  console.log('== API Example ==')
  const neo = new Neo({
    network: network,
    storageType: 'memory',
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
    const blockCount = await neo.api.getBlockCount()
    console.log('=> blockCount:', blockCount)

    const height = 6
    console.log('=> block #6:', await neo.api.getBlock(height))
    console.log('=> block #6 (again):', await neo.api.getBlock(height))

    neo.close()
    console.log('=== THE END ===')
  })
})()
