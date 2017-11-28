/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../../helpers/test-helper')
const Profiles = require('../../../../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
const describeBadge = `[light mode on ${neoNode.domain}:${neoNode.port}]`
TestHelper.setHttpInterceptors(false)

// Test Cases

describe(`${describeBadge} getAssetState()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neoNode.rpc.getAssetState(Profiles.Assets.Neo)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should contain 'id' property with an expected value.", (done) => {
    neoNode.rpc.getAssetState(Profiles.Assets.Neo)
      .then((res) => {
        expect(res.id).to.be.equal(Profiles.Assets.Neo)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
