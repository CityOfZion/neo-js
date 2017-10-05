const expect = require('chai').expect;
const neo = require('../dist/neo.blockchain.neo').neo;

// Bootstrapping

const mode = 'light';
const neoBlockchain = new neo(mode, 'testnet');
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false);

// Test cases

describe(`[${mode} mode on ${neoNode.domain}] getBlockCount()`, () => {
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

describe(`[${mode} mode on ${neoNode.domain}] getBestBlockHash()`, () => {
    it('should have string as its response data type.', (resolve) => {
        neoNode.getBestBlockHash()
            .then((res) => {
                const hash = res;
                expect(typeof(hash)).to.equal('string');
                resolve();
            });
    });

    it("should be '0x' follow by 64 hex characters in lower-case.", (resolve) => {
        neoNode.getBestBlockHash()
            .then((res) => {
                const hash = res;
                expect(hash).to.match(/^(0x)[a-z0-9]{64}$/);
                resolve();
            });
    });
});
