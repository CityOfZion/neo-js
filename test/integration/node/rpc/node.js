/* global describe it */

const expect = require('chai').expect
const TestHelper = require('../../../helpers/test-helper')

// Bootstrapping

const neo = TestHelper.getNeo()
const describeBadge = `[light mode on testnet]`
TestHelper.setHttpInterceptors(false)

// Test Cases

describe(`${describeBadge} getBestBlockHash()`, () => {
  it('should have string as its response data type.', (done) => {
    neo.mesh.rpc('getBestBlockHash')
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
    neo.mesh.rpc('getBestBlockHash')
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

describe(`${describeBadge} getBlockCount()`, () => {
  it('should have integer as its response data type.', (done) => {
    neo.mesh.rpc('getBlockCount')
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
    neo.mesh.rpc('getBlockCount')
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

describe(`${describeBadge} getConnectionCount()`, () => {
  it('should have integer as its response data type.', (done) => {
    neo.mesh.rpc('getConnectionCount')
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
    neo.mesh.rpc('getBlockCount')
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

describe(`${describeBadge} getRawMemPool()`, () => {
  it('should have array as its response data type.', (done) => {
    neo.mesh.rpc('getRawMemPool')
      .then((res) => {
        expect(res).to.be.an('array')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})

describe(`${describeBadge} getPeers()`, () => {
  it('should have object as its response data type.', (done) => {
    neo.mesh.rpc('getPeers')
      .then((res) => {
        expect(res).to.be.an('object')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
