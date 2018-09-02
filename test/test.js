'use strict'
var expect = require('chai').expect
var Neo = require('../dist/neo').default

describe('static version test', () => {
  it('should return 0.10.0', () => {
    var actual = Neo.VERSION
    expect(actual).to.equal('0.10.0')
  })
})

describe('instance version test', () => {
  it('should return 0.10.1', () => {
    var neo = new Neo()
    var actual = neo.VERSION
    expect(actual).to.equal('0.10.1')
  })
})
