/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../helpers/test-helper')
const Profiles = require('../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
TestHelper.setHttpInterceptors(false)

// Test Cases

describe('Unit test getAssetState()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.getAssetState(Profiles.Assets.Neo)
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contain 'id' property with an expected value.", (resolve) => {
    neoNode.getAssetState(Profiles.Assets.Neo)
      .then((res) => {
        expect(res.id).to.be.equal(Profiles.Assets.Neo)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})
