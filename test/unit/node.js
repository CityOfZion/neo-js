/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../helpers/test-helper')
const Profiles = require('../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
TestHelper.setMockHttpClient()
TestHelper.setHttpInterceptors(false)

// Test Cases

describe('Unit test getBestBlockHash()', () => {
  it('should have string as its response data type.', (done) => {
    neoNode.getBestBlockHash()
      .then((res) => {
        const hash = res
        expect(hash).to.be.a('string')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should be '0x' follow by 64 hex characters in lower-case.", (done) => {
    neoNode.getBestBlockHash()
      .then((res) => {
        const hash = res
        expect(hash).to.match(/^(0x)[a-f0-9]{64}$/)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe('Unit test getBlockCount()', () => {
  it('should have integer as its response data type.', (done) => {
    neoNode.getBlockCount()
      .then((res) => {
        const blockCount = res
        expect(blockCount).to.be.a('number')
        expect(blockCount % 1).to.be.equal(0)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('should have at least 1 block.', (done) => {
    neoNode.getBlockCount()
      .then((res) => {
        const blockCount = res
        expect(blockCount).to.be.at.least(1)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe('Unit test getConnectionCount()', () => {
  it('should have integer as its response data type.', (done) => {
    neoNode.getConnectionCount()
      .then((res) => {
        const count = res
        expect(count).to.be.a('number')
        expect(count % 1).to.be.equal(0)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('should have at least 1 connection.', (done) => {
    neoNode.getBlockCount()
      .then((res) => {
        const count = res
        expect(count).to.be.at.least(1)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
