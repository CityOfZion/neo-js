/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../helpers/test-helper')
const Profiles = require('../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
const describeBadge = `[light mode on ${neoNode.domain}:${neoNode.port}]`
TestHelper.setHttpInterceptors(false)

// Test Cases

describe(`${describeBadge} getRawTransaction()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neoNode.getRawTransaction(Profiles.Blocks.Block_100000.Transactions[0].Hash)
      .then((res) => {
        expect(res).to.be.a('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} getTXOut()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    neoNode.getTXOut(Profiles.Blocks.Block_100000.Transactions[0].Hash, 0)
      .then((res) => {
        expect(res).to.be.null
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
