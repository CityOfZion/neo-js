#!/usr/bin/env node

/**
 * Private Network Example
 *
 * An example usage to have a running node instance connecting to a private network.
 * This works with the neo-privatenet-docker project found here:
 *
 * https://github.com/CityOfZion/neo-privatenet-docker
 *
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:node:privatenet', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Private Network Example ==')

  /**
   * We manually set up the nodes to connect to. These are the ones neo-privatenet-docker
   * exposes to the Docker container.
   */
  const options = {
    network: {
      network: 'privnet',
      endpoints: [
        { domain: 'http://127.0.0.1', port: 30333 },
        { domain: 'http://127.0.0.1', port: 30334 },
        { domain: 'http://127.0.0.1', port: 30335 },
        { domain: 'http://127.0.0.1', port: 30336 }
      ]
    }
  }

  // Instantiate a private network node with memory storage
  const neo = new Neo(options)

  logger.info('The node is set up. Test call to getBestBlockHash follows.')
  logger.info('getBestBlockHash:', await neo.mesh.rpc('getBestBlockHash'))

  logger.info('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
