/* eslint handle-callback-err: "off" */
/* eslint new-cap: "off" */
const neonDB = require('@cityofzion/neon-js').api.neonDB
const nep5 = require('@cityofzion/neon-js').api.nep5

/**
 * @class wallet
 * @description
 * A wallet wrapper class on top of the neon-js light wallet.
 * @requires neon-js
 */
class wallet {
  /**
   * @param {Object} options
   */
  constructor (options = {}) {
    Object.assign(this, {
      network: {},
      neonDbNet: ''
    }, options)

    if (this.neonDbNet === '') {
      if (this.network === 'mainnet') {
        this.neonDbNet = 'MainNet'
      } else if (this.network === 'testnet') {
        this.neonDbNet = 'TestNet'
      }
    }
  }

  prepareScriptHash (scriptHash) {
    return scriptHash.replace(/^0x/, '')
  }

  /**
   * Get balances of NEO and GAS for an address
   * @param {string} address - Address to check.
   * @return {Promise<Balance>} Balance of address
   */
  getBalance (address) {
    return neonDB.getBalance(this.neonDbNet, address)
      .catch((err) => {
        console.log('[light-wallet] getBalance err:', err)
      })
  }

  /**
   * Get amounts of available (spent) and unavailable claims.
   * @param {string} address - Address to check.
   * @return {Promise<Claim>} An object with available and unavailable GAS amounts.
   */
  getClaims (address) {
    return neonDB.getClaims(this.neonDbNet, address)
      .catch((err) => {
        console.log('[light-wallet] getClaims err:', err)
      })
  }

  /**
   * Get transaction history for an account
   * @param {string} address - Address to check.
   * @return {Promise<History>} History
   */
  getTransactionHistory (address) {
    return neonDB.getTransactionHistory(this.neonDbNet, address)
      .catch((err) => {
        console.log('[light-wallet] transactionHistory err:', err)
      })
  }

  /**
   * Get the token balance of Address from Contract
   * @param {string} scriptHash
   * @param {string} address
   * @return {Promise<number>}
   */
  getTokenBalance (scriptHash, address) {
    return neonDB.getRPCEndpoint(this.neonDbNet)
      .then((endpoint) => {
        return nep5.getTokenBalance(endpoint, this.prepareScriptHash(scriptHash), address)
      })
      .catch((err) => {
        console.log('[light-wallet] getTokenBalance err:', err)
      })
  }

  /**
   * Send an asset to an address
   * @param {string} toAddress - The destination address.
   * @param {string} from - Private Key or WIF of the sending address.
   * @param {{NEO: number, GAS: number}} assetAmounts - The amount of each asset (NEO and GAS) to send, leave empty for 0.
   * @param {function} [signingFunction] - Optional signing function. Used for external signing.
   * @return {Promise<Response>} RPC Response
   */
  doSendAsset (toAddress, from, assetAmounts, signingFunction) {
    return neonDB.doSendAsset(this.neonDbNet, toAddress, from, assetAmounts, signingFunction)
      .catch((err) => {
        console.log('[light-wallet] sendAsset err:', err)
      })
  }

  /**
   * Perform a ClaimTransaction for all available GAS based on API
   * @param {string} privateKey - Private Key or WIF.
   * @param {function} [signingFunction] - Optional async signing function. Used for external signing.
   * @return {Promise<Response>} RPC response from sending transaction
   */
  doClaimAllGas (privateKey, signingFunction) {
    return neonDB.doClaimAllGas(this.neonDbNet, privateKey, signingFunction)
      .catch((err) => {
        console.log('[light-wallet] claimAllGas err:', err)
      })
  }

  /**
   * Call mintTokens for RPX
   * @param {string} scriptHash - Contract scriptHash.
   * @param {string} fromWif - The WIF key of the originating address.
   * @param {number} neo - The amount of neo to send to RPX.
   * @param {number} gasCost - The Gas to send as SC fee.
   * @return {Promise<Response>} RPC Response
   */
  doMintTokens (scriptHash, fromWif, neo, gasCost, signingFunction) {
    return neonDB.doMintTokens(this.neonDbNet, this.prepareScriptHash(scriptHash), fromWif, neo, gasCost, signingFunction)
      .catch((err) => {
        console.log('[light-wallet] mintTokens err:', err)
      })
  }

  /**
   * Transfers NEP5 Tokens.
   * @param {string} net
   * @param {string} scriptHash
   * @param {string} fromWif
   * @param {string} toAddress
   * @param {number} transferAmount
   * @param {number} gasCost
   * @param {function} signingFunction
   * @return {Promise<Response>} RPC response
   */
  doTransferToken (scriptHash, fromWif, toAddress, transferAmount, gasCost = 0, signingFunction = null) {
    return nep5.doTransferToken(this.neonDbNet, this.prepareScriptHash(scriptHash), fromWif, toAddress, transferAmount, gasCost, signingFunction)
      .catch((err) => {
        console.log('[light-wallet] doTransferToken err:', err)
      })
  }
}

module.exports = wallet
