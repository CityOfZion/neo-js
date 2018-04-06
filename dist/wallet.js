const EventEmitter = require('events')
const neonDB = require('@cityofzion/neon-js').api.neonDB
const nep5 = require('@cityofzion/neon-js').api.nep5
const HashHelper = require('./common/hash-helper')
const Logger = require('./common/logger')

/**
 * @class Wallet
 * @description
 * A wallet wrapper class on top of the neon-js light wallet.
 * @param {Object} options
 * @param {string} options.network
 * @param {string} options.neonDbNet
 * @param {Object} options.loggerOptions
 */
class Wallet extends EventEmitter {
  /**
   * @fires Wallet#constructor:complete
   */
  constructor (options = {}) {
    super()

    // -- Properties
    /** @type {Object} */
    this.logger = undefined
    /** @type {Object} */
    this.defaultOptions = {
      network: '',
      neonDbNet: '',
      loggerOptions: {}
    }

    // -- Bootstrap
    Object.assign(this, this.defaultOptions, options)
    this.logger = new Logger('Wallet', this.loggerOptions)
    this.initNeonDbNet()
    /**
     * @event Wallet#constructor:complete
     * @type {object}
     */
    this.emit('constructor:complete')
  }

  /**
   * @private
   * @returns {void}
   */
  initNeonDbNet () {
    if (this.neonDbNet === '') {
      if (this.network === 'mainnet') {
        this.neonDbNet = 'MainNet'
      } else if (this.network === 'testnet') {
        this.neonDbNet = 'TestNet'
      }
    }
  }

  /**
   * Get balances of NEO and GAS for an address
   * @public
   * @param {string} address - Address to check.
   * @returns {Promise.<Object>} Balance of address
   */
  getBalance (address) {
    this.logger.debug('getBalance triggered. address:', address)
    return neonDB.getBalance(this.neonDbNet, address)
      .catch((err) => {
        this.logger.error('getBalance err:', err)
      })
  }

  /**
   * Get amounts of available (spent) and unavailable claims.
   * @public
   * @param {string} address - Address to check.
   * @returns {Promise.<Object>} An object with available and unavailable GAS amounts.
   */
  getClaims (address) {
    this.logger.debug('getClaims triggered. address:', address)
    return neonDB.getClaims(this.neonDbNet, address)
      .catch((err) => {
        this.logger.error('getClaims err:', err)
      })
  }

  /**
   * Get transaction history for an account
   * @public
   * @param {string} address - Address to check.
   * @returns {Promise.<Object>} History
   */
  getTransactionHistory (address) {
    this.logger.debug('getTransactionHistory triggered. address:', address)
    return neonDB.getTransactionHistory(this.neonDbNet, address)
      .catch((err) => {
        this.logger.error('transactionHistory err:', err)
      })
  }

  /**
   * Get the token balance of Address from Contract
   * @public
   * @param {string} scriptHash
   * @param {string} address
   * @returns {Promise.<Object>}
   */
  getTokenBalance (scriptHash, address) {
    this.logger.debug('getTokenBalance triggered. scriptHash:', scriptHash, 'address:', address)
    return neonDB.getRPCEndpoint(this.neonDbNet)
      .then((endpoint) => {
        return nep5.getTokenBalance(endpoint, HashHelper.denormalize(scriptHash), address)
      })
      .catch((err) => {
        this.logger.error('getTokenBalance err:', err)
      })
  }

  /**
   * Send an asset to an address
   * @public
   * @param {string} toAddress - The destination address.
   * @param {string} from - Private Key or WIF of the sending address.
   * @param {{NEO: number, GAS: number}} assetAmounts - The amount of each asset (NEO and GAS) to send, leave empty for 0.
   * @param {function} [signingFunction] - Optional signing function. Used for external signing.
   * @returns {Promise.<Object>} RPC Response
   */
  doSendAsset (toAddress, from, assetAmounts, signingFunction) {
    this.logger.debug('doSendAsset triggered. toAddress:', toAddress, 'from:', from, 'assetAmounts:', assetAmounts, 'signingFunction:', signingFunction)
    return neonDB.doSendAsset(this.neonDbNet, toAddress, from, assetAmounts, signingFunction)
      .catch((err) => {
        this.logger.error('sendAsset err:', err)
      })
  }

  /**
   * Perform a ClaimTransaction for all available GAS based on API
   * @public
   * @param {string} privateKey - Private Key or WIF.
   * @param {function} [signingFunction] - Optional async signing function. Used for external signing.
   * @returns {Promise.<Object>} RPC response from sending transaction
   */
  doClaimAllGas (privateKey, signingFunction) {
    this.logger.debug('doClaimAllGas triggered. privateKey:', privateKey, 'signingFunction:', signingFunction)
    return neonDB.doClaimAllGas(this.neonDbNet, privateKey, signingFunction)
      .catch((err) => {
        this.logger.error('claimAllGas err:', err)
      })
  }

  /**
   * Call mintTokens for RPX
   * @public
   * @param {string} scriptHash - Contract scriptHash.
   * @param {string} fromWif - The WIF key of the originating address.
   * @param {number} neo - The amount of neo to send to RPX.
   * @param {number} gasCost - The Gas to send as SC fee.
   * @returns {Promise.<Object>} RPC Response
   */
  doMintTokens (scriptHash, fromWif, neo, gasCost, signingFunction) {
    this.logger.debug('doMintTokens triggered. scriptHash:', scriptHash, 'fromWif:', fromWif, 'neo:', neo, 'gasCost:', gasCost, 'signingFunction:', signingFunction)
    return neonDB.doMintTokens(this.neonDbNet, HashHelper.denormalize(scriptHash), fromWif, neo, gasCost, signingFunction)
      .catch((err) => {
        this.logger.error('mintTokens err:', err)
      })
  }

  /**
   * Transfers NEP5 Tokens.
   * @public
   * @param {string} net
   * @param {string} scriptHash
   * @param {string} fromWif
   * @param {string} toAddress
   * @param {number} transferAmount
   * @param {number} gasCost
   * @param {function} signingFunction
   * @returns {Promise.<Object>} RPC response
   */
  doTransferToken (scriptHash, fromWif, toAddress, transferAmount, gasCost = 0, signingFunction = null) {
    this.logger.debug('doTransferToken triggered. scriptHash:', scriptHash, 'fromWif:', fromWif, 'toAddress:', toAddress, 'transferAmount:', transferAmount, 'gasCost:', gasCost, 'signingFunction:', signingFunction)
    return nep5.doTransferToken(this.neonDbNet, HashHelper.denormalize(scriptHash), fromWif, toAddress, transferAmount, gasCost, signingFunction)
      .catch((err) => {
        this.logger.error('doTransferToken err:', err)
      })
  }
}

module.exports = Wallet
