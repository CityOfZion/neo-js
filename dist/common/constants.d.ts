declare const C: {
    network: {
        testnet: string;
        mainnet: string;
    };
    storage: {
        memory: string;
        mongodb: string;
    };
    rpc: {
        getblock: string;
        getblockcount: string;
        getversion: string;
    };
};
export default C;
