/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
export interface MongodbStorageOptions {
    connectOnInit?: boolean;
    reviewIndexesOnConnect?: boolean;
    connectionString?: string;
    userAgent?: string;
    collectionNames?: {
        blocks?: string;
        blockMetas?: string;
        transactionMetas?: string;
    };
    loggerOptions?: LoggerOptions;
}
export declare class MongodbStorage extends EventEmitter {
    private _isReady;
    private blockDao;
    private blockMetaDao;
    private transactionMetaDao;
    private options;
    private logger;
    constructor(options?: MongodbStorageOptions);
    isReady(): boolean;
    getBlockCount(): Promise<number>;
    getHighestBlockHeight(): Promise<number>;
    setBlockCount(height: number): Promise<void>;
    countBlockRedundancy(height: number): Promise<number>;
    getBlock(height: number): Promise<object>;
    getBlocks(height: number): Promise<object[]>;
    getTransaction(transactionId: string): Promise<object>;
    setBlock(height: number, block: object, options?: object): Promise<void>;
    pruneBlock(height: number, redundancySize: number): Promise<void>;
    analyzeBlocks(startHeight: number, endHeight: number): Promise<object[]>;
    getBlockMetaCount(): Promise<number>;
    getHighestBlockMetaHeight(): Promise<number>;
    setBlockMeta(blockMeta: object): Promise<void>;
    setTransactionMeta(transactionMeta: object): Promise<void>;
    analyzeBlockMetas(startHeight: number, endHeight: number): Promise<object[]>;
    analyzeTransactionMetas(startHeight: number, endHeight: number): Promise<object[]>;
    removeBlockMetaByHeight(height: number): Promise<void>;
    pruneLegacyTransactionMeta(targetApiLevel: number): Promise<void>;
    close(): Promise<void>;
    private readyHandler;
    private validateOptionalParameters;
    private initConnection;
    private setReady;
    private reviewIndexes;
    private reviewBlockIndexForHeight;
    private reviewBlockIndexForTransactionId;
    private reviewBlockMetaIndexForHeight;
    private reviewBlockMetaIndexForTime;
    private reviewTransactionMetaIndexForHeight;
    private reviewTransactionMetaIndexForTime;
    private reviewTransactionMetaIndexForTransactionId;
    private reviewTransactionMetaIndexForType;
}
