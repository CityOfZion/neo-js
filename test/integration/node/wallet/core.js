/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../helpers/test-helper')
const profiles = require('../../../helpers/profiles')

// Bootstrapping

const neo = TestHelper.getNeo()
const describeBadge = `[light mode on testnet]`
TestHelper.setHttpInterceptors(false)

// Test Cases
describe(`${describeBadge} getBalance()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neo.wallet.getBalance(profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} getClaims()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neo.wallet.getClaims(profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} getTransactionHistory()`, () => {
  it("should have 'array' as its response data type.", (done) => {
    neo.wallet.getTransactionHistory(profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('array')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} getTokenBalance()`, () => {
  it('should return a number greater than zero.', (done) => {
    neo.wallet.getTokenBalance(profiles.Contracts.LOCALTOKEN_Test, profiles.Wallets.WalletC.Address)
      .then((res) => {
        expect(res).to.be.above(0)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} doSendAsset()`, () => {
  it('should return a success indicator.', (done) => {
    neo.wallet.doSendAsset(profiles.Wallets.WalletB.Address, profiles.Wallets.WalletA.Wif, { GAS: 1, NEO: 1 })
      .then((response) => {
        expect(response).to.have.property('result', true)
        expect(response.txid).to.be.a('string')
        neo.wallet.doSendAsset(profiles.Wallets.WalletA.Address, profiles.Wallets.WalletB.Wif, { GAS: 1, NEO: 1 })
          .then((response) => {
            expect(response).to.have.property('result', true)
            expect(response.txid).to.be.a('string')
            done()
          })
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} doTransferTokens()`, () => {
  it('should successfully transfer a token.', (done) => {
    const scriptHash = profiles.Contracts.LOCALTOKEN_Test
    const fromWif = 'L5FzBMGSG2d7HVJL5vWuXfxUKsrkX5irFhtw1L5zU4NAvNuXzd8a'
    const transferAmount = 1
    const gasCost = 0
    neo.wallet.doTransferToken(scriptHash, fromWif, profiles.Wallets.WalletC.Address, transferAmount, gasCost)
      .then(({ result }) => {
        expect(result).to.equal(true)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
