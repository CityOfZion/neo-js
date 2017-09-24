const chai = require('chai');
// const assert = chai.assert;
const expect = chai.expect;
// const should = chai.should();
const Profiles  = require('../examples/profiles');
const neo = require('../dist/neo.blockchain.neo').neo;

// console.log(assert);

// Setup node
const neoBlockchain = new neo('light', 'testnet');
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false);

describe('node.getBlockCount()', () => {

    it('should have number as its response data type.', (resolve) => {
        neoNode.getBlockCount()
            .then((res) => {
                const blockCount = res;
                expect(typeof(blockCount)).to.equal('number');
                resolve();
            });
    });

    it('should have at least 1 block.', (resolve) => {
        neoNode.getBlockCount()
            .then((res) => {
                const blockCount = res;
                expect(blockCount).to.be.at.least(1);
                resolve();
            });
    });

});