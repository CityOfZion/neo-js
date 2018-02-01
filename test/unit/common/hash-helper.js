/* global describe it */

const expect = require('chai').expect
const profiles = require('../../helpers/profiles')
const HashHelper = require('../../../dist/common/hash-helper')

// Bootstrapping

// Test Cases

describe('HashHelper unit tests', () => {
  const rpxHash = profiles.Contracts.RPX_Test
  const rpxHashWithoutPrefix = '5b7074e873973a6ed3708862f219a6fbf4d1c411'

  describe('Unit test normalize()', () => {
    it('normalize() a normalized hash should have the same hash.', () => {
      expect(HashHelper.normalize(rpxHash)).to.equal(rpxHash)
    })

    it('normalize() a unnormalized hash should have its normalized hash value.', () => {
      expect(HashHelper.normalize(rpxHashWithoutPrefix)).to.equal(rpxHash)
    })
  })

  describe('Unit test denormalize()', () => {
    it('normalize() a normalized hash should have its denormalized hash value.', () => {
      expect(HashHelper.denormalize(rpxHash)).to.equal(rpxHashWithoutPrefix)
    })

    it('denormalize() a unnormalized hash should have the same hash.', () => {
      expect(HashHelper.denormalize(rpxHashWithoutPrefix)).to.equal(rpxHashWithoutPrefix)
    })
  })
})
