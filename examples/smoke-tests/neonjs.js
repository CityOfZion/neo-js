#!/usr/bin/env node

const Neon = require('@cityofzion/neon-js')

// -- Parameters

const rpcUrl = 'https://seed1.neo.org:20331'
const blockHeight = 1
const verboseKey = 1

// -- Implementation

;(async () => {
  console.log('== neon.js Example ==')
  // console.log('Neon:', Neon)
  // console.log('Neon.rpc:', Neon.rpc)

  const q = new Neon.rpc.Query({ method: 'getblock', params: [blockHeight, verboseKey] })
  console.log('q:', q)
  q.execute(rpcUrl)
    .then((res) => {
      console.log('res:', res)
    })
    .catch((err) => {
      console.log('err:', err)
    })
})()
