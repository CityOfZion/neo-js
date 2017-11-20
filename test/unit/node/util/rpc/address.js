/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../../helpers/test-helper')
const Profiles = require('../../../../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
TestHelper.setMockHttpClient()
TestHelper.setHttpInterceptors(false)

// Test Cases

describe('Unit test getAccountState()', () => {
  it("should have 'object' as its response data type.", (done) => {
    neoNode.rpc.getAccountState(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should contain 'script_hash' property with an expected value.", (done) => {
    neoNode.rpc.getAccountState(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res.script_hash).to.be.equal(Profiles.Wallets.WalletN.Hash)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe('Unit test validateAddress()', () => {
  it("should have 'object' as its response data type.", (done) => {
    neoNode.rpc.validateAddress(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should contain 'isvalid' property with an expected value of true.", (done) => {
    neoNode.rpc.validateAddress(Profiles.Wallets.WalletN.Address)
      .then((res) => {
        expect(res.isvalid).to.be.equal(true)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
