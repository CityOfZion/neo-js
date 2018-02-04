#!/usr/bin/env node

/* eslint camelcase: "off" */

/**
 * Asset-related Usage Example
 *
 * Demo on available asset methods:
 * - store.getAssetList
 * - store.getAsset
 * - store.getAssetState
 * - store.getAssetBalance
 * - store.getAssetTransactions
 */

// -- Bootstrap

const Neo = require('../../dist/neo')
const Logger = require('../../dist/common/logger')
const logger = new Logger('examples:node:asset', { level: Logger.levels.INFO })

// -- Chain of command

async function main () {
  logger.info('== Test Syncing Example ==')

  // Instantiate a testnet node with local storage
  const neo = new Neo({
    network: 'testnet',
    storageOptions: {
      model: 'mongoDB'
    }
  })

  const address_AUX = 'AUXdujLmR79gzZXQAaVQXCAeseYc7edc9Q'
  const kacHash = '0xb426d50907c2b1ff91a8d5c8f1da3bea77e79ada05885719130d99cabae697c0'

  // -- Example usages of asset related usages

  const assetList = await neo.storage.getAssetList()
  logger.info('assetList:', assetList)
  /**
   * Expected response:
   * [ { _id: 5a1dcfc64e45910dfdfe395d,
   *     address: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
   *     asset: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
   *     type: 'a',
   *     __v: 0,
   *     state:
   *      { version: 0,
   *        id: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
   *        type: 'GoverningToken',
   *        name: [Array],
   *        amount: '100000000',
   *        available: '100000000',
   *        precision: 0,
   *        owner: '00',
   *        admin: 'Abf2qMs1pzQb8kYk9RuxtUb9jtRKJVuBJt',
   *        issuer: 'Abf2qMs1pzQb8kYk9RuxtUb9jtRKJVuBJt',
   *        expiration: 4000000,
   *        frozen: false },
   *     history: [],
   *     assets: [] }, ... TRUNCATED ... ]
   */

  const assetState = await neo.storage.getAssetState(kacHash)
  logger.info('assetState:', assetState)
  /**
   * Expected response:
   * { frozen: false,
   *   expiration: 4005804,
   *   issuer: 'AUkVH4k8gPowAEpvQVAmNEkriX96CrKzk9',
   *   admin: 'AUkVH4k8gPowAEpvQVAmNEkriX96CrKzk9',
   *   owner: '039b2c6b8a8838595b8ebcc67bbc85cec78d805d56890e9a0d71bcae89664339d6',
   *   precision: 8,
   *   available: '90000000',
   *   amount: '-0.00000001',
   *   name: [ { name: '开拍学园币（KAC）', lang: 'zh-CN' } ],
   *   type: 'Token',
   *   id: '0xb426d50907c2b1ff91a8d5c8f1da3bea77e79ada05885719130d99cabae697c0',
   *   version: 0 }
   */

  const assetBalance = await neo.storage.getAssetBalance(address_AUX, kacHash)
  logger.info('assetBalance:', assetBalance)
  /**
   * Expected response:
   * { asset: '0xb426d50907c2b1ff91a8d5c8f1da3bea77e79ada05885719130d99cabae697c0',
   *   balance: 100762,
   *   index: 839318,
   *   type: 'a' }
   */

  const transactions = await neo.storage.getAssetTransactions(address_AUX, kacHash)
  logger.info('transactions:', transactions)
  /**
   * Expected response:
   * [ { blockIndex: 155487,
   *   value: 100000,
   *   tx:
   *    { _id: 5a1dea35291137207982ace3,
   *      txid: '0x11fdf64d27d6a9c7ace00b649bebb1abe0ec7832508a2a1b81c03de3ca0e63a8',
   *      size: 262,
   *      type: 'ContractTransaction',
   *      version: 0,
   *      sys_fee: 0,
   *      net_fee: 0,
   *      blockIndex: 155487,
   *      __v: 0,
   *      scripts: [Array],
   *      vout: [Array],
   *      vin: [Array],
   *      attributes: [] } }, ... TRUNCATED ...]
   */

  logger.info('== END ==')
  process.exit() // neoBlockchain process in the background. Explicit exit call is needed.
}

// -- Execute

process.on('unhandledRejection', (reason, p) => {
  logger.warn('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

main()
