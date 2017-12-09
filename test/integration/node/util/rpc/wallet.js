/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../../helpers/test-helper')
const Profiles = require('../../../../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
const describeBadge = `[light mode on ${neoNode.domain}:${neoNode.port}]`
TestHelper.setHttpInterceptors(true)

// Test Cases
describe(`${describeBadge} getBalance()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neoNode.wallet.getBalance(Profiles.Wallets.WalletN.Address)
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
    neoNode.wallet.getClaims(Profiles.Wallets.WalletN.Address)
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
    neoNode.wallet.getTransactionHistory(Profiles.Wallets.WalletN.Address)
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
    neoNode.wallet.getTokenBalance(Profiles.Contracts.LOCALTOKEN_Test, Profiles.Wallets.WalletC.Address)
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
    neoNode.wallet.doSendAsset(Profiles.Wallets.WalletB.Address, Profiles.Wallets.WalletA.Wif, { GAS: 1, NEO: 1 })
      .then((response) => {
        expect(response).to.have.property('result', true)
        expect(response.txid).to.be.a('string')
        neoNode.wallet.doSendAsset(Profiles.Wallets.WalletA.Address, Profiles.Wallets.WalletB.Wif, { GAS: 1, NEO: 1 })
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

  describe(`${describeBadge} doTransferTokens()`, () => {
    it('should successfully transfer a token.', (done) => {
      const scriptHash = Profiles.Contracts.LOCALTOKEN_Test
      const fromWif = 'L5FzBMGSG2d7HVJL5vWuXfxUKsrkX5irFhtw1L5zU4NAvNuXzd8a'
      const transferAmount = 1
      const gasCost = 0
      neoNode.wallet.doTransferToken(scriptHash, fromWif, Profiles.Wallets.WalletC.Address, transferAmount, gasCost)
        .then(({ result }) => {
          expect(result).to.equal(true)
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })
})
