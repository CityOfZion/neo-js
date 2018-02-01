/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../helpers/test-helper')
const profiles = require('../../../helpers/profiles')

// Bootstrapping

const neo = TestHelper.getNeo()
const describeBadge = `[light mode on testnet]`
TestHelper.setHttpInterceptors(false)

// Test Cases

describe(`${describeBadge} getAccountState()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neo.mesh.rpc('getAccountState', profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should contain 'script_hash' property with an expected value.", (done) => {
    neo.mesh.rpc('getAccountState', profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res.script_hash).to.be.equal(profiles.Wallets.WalletN.Hash)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} validateAddress()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neo.mesh.rpc('validateAddress', profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should contain 'isvalid' property with an expected value of true.", (done) => {
    neo.mesh.rpc('validateAddress', profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res.isvalid).to.be.equal(true)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
