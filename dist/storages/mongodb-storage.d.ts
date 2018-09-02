/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
export interface MongodbStorageOptions {
    connectOnInit?: boolean;
    connectionString?: string;
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
    private getBlockModel;
    private initConnection;
    private setReady;
    getBlockCount(): Promise<number>;
    setBlockCount(blockHeight: number): void;
    getBlock(height: number): Promise<object>;
    setBlock(height: number, block: object, source: object): Promise<void>;
    disconnect(): Promise<void>;
}
