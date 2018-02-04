/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../helpers/test-helper')
const profiles = require('../../../helpers/profiles')

// Bootstrapping

const neo = TestHelper.getNeo()
TestHelper.setMockHttpClient()
TestHelper.setHttpInterceptors(false)

// Test Cases

describe('Unit test getRawTransaction()', () => {
  it("should have 'object' as its response data type.", (done) => {
    neo.mesh.rpc('getRawTransaction', profiles.Blocks.Block_100000.Transactions[0].Hash)
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
    neo.mesh.rpc('getTXOut', { txid: profiles.Blocks.Block_608999.Transactions[1].Hash, index: 0 })
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
