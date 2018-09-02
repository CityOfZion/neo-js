#!/usr/bin/env node

const Neo = require('../../dist/neo').Neo

// -- Implementation

;(async () => {
  console.log('== Basic Example ==')
  const neo = new Neo({
    network: 'testnet',
    meshOptions: {
      loggerOptions: { level: 'debug' },
    },
    apiOptions: {
      loggerOptions: { level: 'debug' },
    },
    loggerOptions: { level: 'debug' },
  })

  const endpoint = neo.mesh.nodes[0].endpoint
  const blockCount = await neo.mesh.nodes[0].getBlockCount()
  console.log('endpoint:', endpoint, 'blockCount:', blockCount)
  neo.close()
})()
