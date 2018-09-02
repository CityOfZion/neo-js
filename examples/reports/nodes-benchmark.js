#!/usr/bin/env node

const Neo = require('../../dist/neo').Neo
const Logger = require('node-log-it').Logger
const logger = new Logger('nodes-benchmark', { level: 'info' })

// -- Parameters

const network = 'testnet'
const benchmarkDurationMs = 30 * 1000

// -- Implementation

;(async () => {
  logger.info('== Nodes Benchmark Report ==')
  const neo = new Neo({
    network: network,
    nodeOptions: {
      loggerOptions: { level: 'info' },
    },
    meshOptions: {
      loggerOptions: { level: 'info' },
    },
    loggerOptions: { level: 'info' },
  })

  neo.mesh.on('ready', () => {
    logger.info('neo.mesh indicates that it is now in ready state!')
  })

  const reportIntervalId = setInterval(() => {
    const fastestNode = neo.mesh.getFastestNode()
    if (fastestNode) {
      logger.info('fastestNode endpoint:', fastestNode.endpoint, 'latency:', fastestNode.latency)
    } else {
      logger.info('no fastestNode available.')
    }

    const highestNode = neo.mesh.getHighestNode()
    if (highestNode) {
      logger.info('highestNode endpoint:', highestNode.endpoint, 'blockHeight:', highestNode.blockHeight)
    } else {
      logger.info('no highestNode available.')
    }
  }, 5000)

  setTimeout(() => {
    neo.close()
    clearInterval(reportIntervalId)
    logger.info('=== THE END ===')
  }, benchmarkDurationMs)
})()
