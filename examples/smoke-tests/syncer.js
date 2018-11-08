#!/usr/bin/env node

const moment = require('moment')
const Neo = require('../../dist/neo').Neo

process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled promise rejection. Reason:', reason)
})

// -- Parameters

const network = 'mainnet'
const dbConnectOnInit = true
// const dbConnectionString = 'mongodb://localhost/neo_mainnet'
const dbConnectionString = 'mongodb://localhost/neo_mainnet_eclipse'
const blockCollectionName = 'blocks'
const syncDurationMs = 0 * 60 * 1000

// -- Implementation

;(async () => {
  console.log('== Syncer Example ==')
  const neo = new Neo({
    network: network,
    storageType: 'mongodb',
    storageOptions: {
      connectOnInit: dbConnectOnInit,
      connectionString: dbConnectionString,
      collectionNames: {
        blocks: blockCollectionName,
      },
      loggerOptions: { level: 'info' },
    },
    meshOptions: {
      loggerOptions: { level: 'warn' },
    },
    syncerOptions: {
      minHeight: 4001,
      maxHeight: 6000,
      verifyBlocksIntervalMs: 30 * 1000,
      loggerOptions: { level: 'info' },
    },
    loggerOptions: { level: 'info' },
  })


  // Fetch Info
  neo.mesh.on('ready', async () => {
    try {
      const chainBlockCount = await neo.mesh.getHighestNode().getBlockCount()
      console.log('Highest Block Count:', chainBlockCount)
    } catch (err) {
      console.warn('neo.mesh.getHighestNode().getBlockCount() failed. Message:', err.message)
    }

    try {
      const storageBlockCount = await neo.storage.getBlockCount()
      console.log('Highest Count in Storage:', storageBlockCount)
    } catch (err) {
      console.warn('neo.storage.getBlockCount() failed. Message:', err.message)
    }
  })

  // On Completion
  neo.syncer.on('UpToDate', () => {
    console.log('SYNC IS COMPLETE!!!')
  })

  // Live Report
  const report = {
    success: [],
    failed: [],
    max: undefined,
    startDate: moment()
  }
  neo.syncer.on('storeBlock:complete', (payload) => {
    // console.log('syncer storeBlock complete triggered. payload:', payload)
    if (payload.isSuccess) {
      report.success.push({
        height: payload.height,
        date: moment(),
      })
    } else {
      report.failed.push({
        height: payload.height,
        date: moment(),
      })
    }
  })
  const reportIntervalId = setInterval(() => { // Generate report periodically
    if (report.success.length > 0) {
      const node = neo.mesh.getHighestNode()
      if (!node) {
        console.warn('Problem with neo.mesh.getHighestNode().')
        return
      }

      report.max = node.blockHeight
      const msElapsed = moment().diff(report.startDate)
      const successBlockCount = report.success.length
      const highestBlock = report.success[report.success.length - 1].height // This is an guesstimate
      const completionPercentage = Number((highestBlock / report.max * 100).toFixed(4))
      const blockCountPerMinute = Number((successBlockCount / msElapsed * 1000 * 60).toFixed(0))
      console.log(`Blocks synced: ${successBlockCount} (${completionPercentage}% complete) - ${blockCountPerMinute} blocks/minute`)
    } else {
      console.log('No sync progress yet...')
    }
  }, 5000)

  if (syncDurationMs) {
    console.log(`Sync process with stop after ${syncDurationMs} ms...`)
    setTimeout(() => {
      neo.close()
      clearInterval(reportIntervalId)
      console.log('=== THE END ===')
    }, syncDurationMs)
  }
})()
