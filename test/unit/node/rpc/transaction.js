/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../helpers/test-helper')
const Profiles = require('../../../helpers/profiles')

// Bootstrapping

const node = TestHelper.getNeoNode()
TestHelper.setMockHttpClient()
TestHelper.setHttpInterceptors(false)

// Test Cases

describe('Unit test getRawTransaction()', () => {
  it("should have 'object' as its response data type.", (done) => {
    node.mesh.rpc('getRawTransaction', Profiles.Blocks.Block_100000.Transactions[0].Hash)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe('Unit test getTXOut()', () => {
  it("should have 'object' as its response data type.", (done) => {
    node.mesh.rpc('getTXOut', { txid: Profiles.Blocks.Block_608999.Transactions[1].Hash, index: 0 })
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
