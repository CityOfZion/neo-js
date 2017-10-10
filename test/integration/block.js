/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../helpers/test-helper')
const Profiles = require('../helpers/profiles')

// Bootstrapping

const neoNode = TestHelper.getNeoNode()
TestHelper.setHttpInterceptors(false)

// Test Cases

describe('Unit test getBestBlockHash()', () => {
  it('should have string as its response data type.', (resolve) => {
    neoNode.getBestBlockHash()
      .then((res) => {
        const hash = res
        expect(hash).to.be.a('string')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should be '0x' follow by 64 hex characters in lower-case.", (resolve) => {
    neoNode.getBestBlockHash()
      .then((res) => {
        const hash = res
        expect(hash).to.match(/^(0x)[a-f0-9]{64}$/)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test getBlock()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.getBlock(Profiles.Blocks.Block_100000.Number)
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contains 'confirmations' property with a whole number.", (resolve) => {
    neoNode.getBlock(Profiles.Blocks.Block_100000.Number)
      .then((res) => {
        expect(res.confirmations).to.be.a('number')
        expect(res.confirmations % 1).to.be.equal(0)
        expect(res.confirmations).to.be.at.least(1)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test getBlockByHash()', () => {
  it("should have 'object' as its response data type.", (resolve) => {
    neoNode.getBlockByHash(Profiles.Blocks.Block_100000.Hash)
      .then((res) => {
        expect(res).to.be.a('object')
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it("should contains 'confirmations' property with a whole number.", (resolve) => {
    neoNode.getBlockByHash(Profiles.Blocks.Block_100000.Hash)
      .then((res) => {
        expect(res.confirmations).to.be.a('number')
        expect(res.confirmations % 1).to.be.equal(0)
        expect(res.confirmations).to.be.at.least(1)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})

describe('Unit test getBlockCount()', () => {
  it('should have integer as its response data type.', (resolve) => {
    neoNode.getBlockCount()
      .then((res) => {
        const blockCount = res
        expect(blockCount).to.be.a('number')
        expect(blockCount % 1).to.be.equal(0)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })

  it('should have at least 1 block.', (resolve) => {
    neoNode.getBlockCount()
      .then((res) => {
        const blockCount = res
        expect(blockCount).to.be.at.least(1)
        resolve()
      })
      .catch((err) => {
        resolve(err)
      })
  })
})
