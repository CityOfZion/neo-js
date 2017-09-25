const expect = require('chai').expect;
const neo = require('../dist/neo.blockchain.neo').neo;

// Setup node
const neoBlockchain = new neo('light', 'testnet');
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false);

describe(`[light mode on ${neoNode.domain}] getBlockCount()`, () => {

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
