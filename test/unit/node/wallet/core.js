/* global describe it */

const sinon = require('sinon')
const expect = require('chai').expect
const TestHelper = require('../../../helpers/test-helper')
const MockNeonJs = require('../../../helpers/mock-neon-js')
const profiles = require('../../../helpers/profiles')

// Bootstrapping

const neo = TestHelper.getNeo()
const neonDB = require('@cityofzion/neon-js').api.neonDB
const nep5 = require('@cityofzion/neon-js').api.nep5

// Test Cases

describe('Wallet unit tests', () => {
  let sandbox

  before(() => {
    sandbox = sinon.sandbox.create()
    sandbox.stub(neonDB, 'getBalance').value(MockNeonJs.getBalance)
    sandbox.stub(neonDB, 'getClaims').value(MockNeonJs.getClaims)
    sandbox.stub(neonDB, 'getTransactionHistory').value(MockNeonJs.getTransactionHistory)
    sandbox.stub(nep5, 'getTokenBalance').value(MockNeonJs.getTokenBalance)
    sandbox.stub(neonDB, 'doSendAsset').value(MockNeonJs.doSendAsset)
    sandbox.stub(nep5, 'doTransferToken').value(MockNeonJs.doTransferToken)
    sandbox.stub(neonDB, 'doClaimAllGas').value(MockNeonJs.doClaimAllGas)
    sandbox.stub(neonDB, 'doMintTokens').value(MockNeonJs.doMintTokens)
  })

  after(() => {
    sandbox.restore()
  })

  describe('Unit test getBalance()', () => {
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

  describe(`Unit test getClaims()`, () => {
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

  describe(`Unit test getTransactionHistory()`, () => {
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

  describe(`Unit test getTokenBalance()`, () => {
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

  describe(`Unit test doSendAsset()`, () => {
    it('should return a success indicator.', (done) => {
      neo.wallet.doSendAsset(profiles.Wallets.WalletB.Address, profiles.Wallets.WalletA.Wif, { GAS: 1, NEO: 1 })
        .then((response) => {
          expect(response).to.have.property('result', true)
          expect(response.txid).to.be.a('string')
          done()
        })
        .catch((err) => {
          done(err)
        })
    })
  })

  describe(`Unit test doTransferTokens()`, () => {
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

  describe(`Unit test doClaimAllGas()`, () => {
    it('should claim GAS.', (done) => {
      neo.wallet.doClaimAllGas(profiles.Wallets.WalletC.Wif)
        .then(({ result }) => {
          expect(result).to.equal(true)
          done()
        }).catch((err) => {
          done(err)
        })
    })
  })

  describe(`Unit test doMintTokens()`, () => {
    it('should mint tokens.', (done) => {
      const scriptHash = profiles.Contracts.LOCALTOKEN_Test
      neo.wallet.doMintTokens(scriptHash, profiles.Wallets.WalletC.Wif, 1, 0)
        .then(({ result }) => {
          expect(result).to.equal(true)
          done()
        }).catch((err) => {
          done(err)
        })
    })
  })
})
