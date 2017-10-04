const expect = require('chai').expect;
const neo = require('../dist/neo.blockchain.neo').neo;
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Bootstrapping

const neoBlockchain = new neo('light', 'testnet');
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false);

// Mock Adapter

const mockHttpClient = new MockAdapter(axios, { delayResponse: 50 });
const mockResponseData = {
    getBlockCount: {
        Success: {"jsonrpc":"2.0","id":0,"result":100000},
    },
    getBestBlockHash: {
        Success: {"jsonrpc":"2.0","id":0,"result":"0xf760b3dd56a44e6b139d2a072d9f20ae503e13d01ef9f2385043b90f3a8ae876"},
        Legacy: {"jsonrpc":"2.0","id":0,"result":"f760b3dd56a44e6b139d2a072d9f20ae503e13d01ef9f2385043b90f3a8ae876"}, // Deprecating (yet, not completely obsolete) hash syntax without leading '0x'.
    },
};

// Experimental (and non functional)
// mockHttpClient.onPost('/', '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}').reply(505, {}); // Doesn't work
// mockHttpClient.onPost('/', {body: '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}'}).reply(505, {}); // Doesn't work
// mockHttpClient.onPost('/', {data: '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}'}).reply(505, {}); // Doesn't work
// mockHttpClient.onPost('/', {body: {data: '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}'}}).reply(505, {}); // Doesn't work
// mockHttpClient.onAny().passThrough();

mockHttpClient.onPost().reply((config) => {
    const dataObj = JSON.parse(config.data);

    if (dataObj.method === 'getblockcount') {
        return [200, mockResponseData.getBlockCount.Success];
    } else if (dataObj.method === 'getbestblockhash') {
        return [200, mockResponseData.getBestBlockHash.Success];
    }

    console.log('YOU SHOULDNT BE HERE!');
    return [400, {}];
});

// Test cases

describe('Unit test getBlockCount()', () => {
    it('should have number as its response data type.', (resolve) => {
        neoNode.getBlockCount()
            .then((res) => {
                const blockCount = res;
                expect(typeof(blockCount)).to.equal('number');
                resolve();
            })
            .catch((err) => {
                resolve(err);
            });
    });

    it('should have at least 1 block.', (resolve) => {
        neoNode.getBlockCount()
            .then((res) => {
                const blockCount = res;
                expect(blockCount).to.be.at.least(1);
                resolve();
            })
            .catch((err) => {
                resolve(err);
            });
    });
});

describe('Unit test getBestBlockHash()', () => {
    it('should have string as its response data type.', (resolve) => {
        neoNode.getBestBlockHash()
            .then((res) => {
                const hash = res;
                expect(typeof(hash)).to.equal('string');
                resolve();
            })
            .catch((err) => {
                resolve(err);
            });
    });

    it("should be '0x' follow by 64 hex characters in lower-case.", (resolve) => {
        neoNode.getBestBlockHash()
            .then((res) => {
                const hash = res;
                expect(hash).to.match(/^(0x)[a-f0-9]{64}$/);
                resolve();
            })
            .catch((err) => {
                resolve(err);
            });
    });
});
