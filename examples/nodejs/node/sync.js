#!/usr/bin/env node

/**
 * Blockchain Syncing Example
 *
 * An example usage to have a running node instance syncing in the background while
 * perform user tasks at foreground. Please make sure there is a local MongoDB server running.
 *
 */
// -- Bootstrap

const Neo = require('../../../dist/node')

// -- Chain of command

async function main () {
  console.log('== NeoBlockchain Syncing Example ==')

  // Instantiate a testnet node with local storage
  let options = {
    network: {
      network: 'testnet'
    },
    storage: {
      model: 'mongoDB',
      collectionNames: {
        blocks: 'b_neo_t_blocks',
        transactions: 'b_neo_t_transactions',
        addresses: 'b_neo_t_addresses'
      }
    }
  }

  const node = new Neo(options)

  // Allow it to sync for 30 seconds
  console.log('Start syncing for 30 seconds...')
  await sleep(30000)

  // Report document counts per collection type
  console.log('block count:', await node.storage.getBlockCount())

  // Cherry pick a block, address and transaction document
  // User is expected to find block index '5953' within the first 30 seconds of synchronization
  const cherryBlock = await node.storage.getBlock(5953)
  console.log('cherryBlock, index:', cherryBlock.index, 'hash:', cherryBlock.hash, 'tx.length:', cherryBlock.tx.length)
  const cherryTransaction = await node.storage.getTX('0xf22a4a940fba37d8f58c724a4dc60bdb86d1ebb81ab815437e81ea61f50da24e')
  console.log('cherryTransaction, txid:', cherryTransaction.txid, 'blockIndex:', cherryTransaction.blockIndex, 'type:', cherryTransaction.type)
  const cherryAddress = await node.storage.getBalance('0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7')
  console.log('cherryAddress, address:', cherryAddress.address, 'assets', cherryAddress.assets)

  console.log('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Helper methods

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// -- Execute

main()
