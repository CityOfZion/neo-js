const expect = require('chai').expect;
const neo = require('../dist/neo.blockchain.neo').neo;
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Mock Adapter

const mockHttpClient = new MockAdapter(axios, { delayResponse: 50 });
const mockRequestData = {
    getBlockCount: '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":0}',
    getBestBlockHash: '{"jsonrpc":"2.0","method":"getbestblockhash","params":[],"id":0}',
};
const mockResponseData = {
    getBlockCount: {
        Success: {"jsonrpc":"2.0","id":0,"result":100000},
    },
    getBestBlockHash: {
        Success: {"jsonrpc":"2.0","id":0,"result":"0xf760b3dd56a44e6b139d2a072d9f20ae503e13d01ef9f2385043b90f3a8ae876"},
        Legacy: {"jsonrpc":"2.0","id":0,"result":"f760b3dd56a44e6b139d2a072d9f20ae503e13d01ef9f2385043b90f3a8ae876"}, // Deprecating (yet, not completely obsolete) hash syntax without leading '0x'.
    },
};

mockHttpClient.onAny().reply((config) => {
    if (config.data == mockRequestData.getBlockCount) {
        return [200, mockResponseData.getBlockCount];
    } else if (config.data == mockRequestData.getBestBlockHash) {
        // console.log('[BOOM] onAny mock. confing:', config);
        // return [503, {}];
        return [200, mockResponseData.getBestBlockHash.Success];
    }

    console.log('YOU SHOULDNT BE HERE!');
    return [400, {}];
});

// Bootstrapping

const mode = 'light';
const neoBlockchain = new neo(mode, 'testnet');
const neoNode = neoBlockchain.nodeWithBlock(-1, 'latency', false);

// Test cases

describe(`Unit Test getBestBlockHash()`, () => {
    it('should have string as its response data type.', (resolve) => {
        neoNode.getBestBlockHash()
            .then((res) => {
                let hash = res;
                expect(typeof(hash)).to.equal('string');
                resolve();
            });
    });
});
