#!/usr/bin/env node

const Neo = require('../../dist/neo').Neo

// -- Implementation

;(async () => {
  console.log('== Get Version Example ==')
  console.log('Neo class Version:', Neo.VERSION)
  const neo = new Neo()
  console.log('Neo instance Version:', neo.VERSION)
  neo.close()
})()
