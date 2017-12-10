/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../../helpers/test-helper')
const Profiles = require('../../../../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
const describeBadge = `[light mode on ${neoNode.domain}:${neoNode.port}]`
TestHelper.setHttpInterceptors(false)

// Test Cases

describe(`${describeBadge} getContractState()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neoNode.rpc.getContractState(Profiles.Contracts.RPX_Test)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should contain 'hash' property with an expected value.", (done) => {
    neoNode.rpc.getContractState(Profiles.Contracts.RPX_Test)
      .then((res) => {
        expect(res.hash).to.be.equal(Profiles.Contracts.RPX_Test)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
