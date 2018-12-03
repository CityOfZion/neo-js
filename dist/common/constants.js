"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const C = {
    network: {
        testnet: 'testnet',
        mainnet: 'mainnet',
    },
    storage: {
        memory: 'memory',
        mongodb: 'mongodb',
    },
    rpc: {
        getblock: 'getblock',
        getblockcount: 'getblockcount',
        getversion: 'getversion',
        getrawtransaction: 'getrawtransaction',
    },
    transaction: {
        MinerTransaction: 'MinerTransaction',
        ContractTransaction: 'ContractTransaction',
        InvocationTransaction: 'InvocationTransaction',
        ClaimTransaction: 'ClaimTransaction',
    },
};
exports.default = C;
//# sourceMappingURL=constants.js.map