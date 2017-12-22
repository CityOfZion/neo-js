/* global describe it */
/* eslint no-unused-expressions: "off" */
const expect = require('chai').expect
const TestHelper = require('../../../helpers/test-helper')
const Profiles = require('../../../helpers/profiles')

// Bootstrapping

const node = TestHelper.getNeoNode()
const describeBadge = `[light mode on testnet]`
TestHelper.setHttpInterceptors(false)

// Test Cases

describe(`${describeBadge} getRawTransaction()`, () => {
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

describe(`${describeBadge} getTXOut()`, () => {
  it("should have 'object' as its response data type.", (done) => {
    node.mesh.rpc('getTXOut', { txid: Profiles.Blocks.Block_100000.Transactions[0].Hash, index: 0 })
      .then((res) => {
        expect(res).to.be.null
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
