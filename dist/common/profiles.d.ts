declare const profiles: {
    rpc: {
        mainnet: {
            endpoint: string;
        }[];
        testnet: {
            endpoint: string;
        }[];
    };
    assets: {
        id: string;
        name: string;
        symbol: string;
        type: string;
        precision: number;
    }[];
};
export default profiles;
