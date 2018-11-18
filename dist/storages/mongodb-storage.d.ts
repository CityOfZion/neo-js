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
        transactions?: string;
        assets?: string;
    };
    loggerOptions?: LoggerOptions;
}
export declare class MongodbStorage extends EventEmitter {
    private _isReady;
    private blockModel;
    private options;
    private logger;
    constructor(options?: MongodbStorageOptions);
    isReady(): boolean;
    getBlockCount(): Promise<number>;
    setBlockCount(height: number): Promise<void>;
    countBlockRedundancy(height: number): Promise<number>;
    getBlock(height: number): Promise<object>;
    getBlocks(height: number): Promise<object[]>;
    setBlock(height: number, block: object, options?: object): Promise<void>;
    pruneBlock(height: number, redundancySize: number): Promise<void>;
    analyzeBlocks(startHeight: number, endHeight: number): Promise<object[]>;
    disconnect(): Promise<void>;
    private validateOptionalParameters;
    private getBlockModel;
    private initConnection;
    private setReady;
    private reviewIndexes;
    private hasIndex;
    private createIndex;
    private getBlockDocument;
    private getBlockDocuments;
}
