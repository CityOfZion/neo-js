#!/usr/bin/env node

const Neo = require('../../dist/neo').Neo

// -- Implementation

;(async () => {
  console.log('== Get Version Example ==')
  console.log('Neo class Version:', Neo.VERSION)
  console.log('Neo class user agent:', Neo.UserAgent)
})()
