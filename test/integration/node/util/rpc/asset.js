/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../../helpers/test-helper')
const Profiles = require('../../../../helpers/profiles')

// Bootstrapping

const node = TestHelper.getNeoNode()
const describeBadge = `[light mode on testnet]`
TestHelper.setHttpInterceptors(false)

// Test Cases

describe(`${describeBadge} getAssetState()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    node.mesh.rpc('getAssetState', Profiles.Assets.Neo)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should contain 'id' property with an expected value.", (done) => {
    node.mesh.rpc('getAssetState', Profiles.Assets.Neo)
      .then((res) => {
        expect(res.id).to.be.equal(Profiles.Assets.Neo)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
