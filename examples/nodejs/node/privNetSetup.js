#!/usr/bin/env node

/**
 * Private network Example
 *
 * An example usage to have a running node instance connecting to a private network.
 * This works with the neo-privatenet-docker project found here:
 *
 * https://github.com/CityOfZion/neo-privatenet-docker
 *
 */
// -- Bootstrap

const Neo = require('../../../dist/node')

// -- Chain of command

async function main () {
  console.log('== NeoBlockchain PrivNet Example ==')

  /**
   * We manually set up the nodes to connect to. These are the ones neo-privatenet-docker
   * exposes to the Docker container.
   */
  const options = {
    network: {
      endpoints: [
        { domain: 'http://127.0.0.1', port: 30333 },
        { domain: 'http://127.0.0.1', port: 30334 },
        { domain: 'http://127.0.0.1', port: 30335 },
        { domain: 'http://127.0.0.1', port: 30336 }
      ]
    }
  }

  // Instantiate a private network node with memory storage
  const node = new Neo(options)

  console.log('The node is set up. Test call to getBestBlockHash follows.')
  console.log('getBestBlockHash:', await node.mesh.rpc('getBestBlockHash'))

  console.log('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Execute

main()
