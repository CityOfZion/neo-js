declare const profiles: {
    version: string;
    rpc: {
        mainnet: {
            endpoint: string;
        }[];
        testnet: {
            endpoint: string;
        }[];
    };
};
export default profiles;
