/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
export interface MemoryStorageOptions {
    loggerOptions?: LoggerOptions;
}
export declare class MemoryStorage extends EventEmitter {
    private _isReady;
    private _blockHeight?;
    private blockCollection;
    private options;
    private logger;
    constructor(options?: MemoryStorageOptions);
    isReady(): boolean;
    getBlockCount(): Promise<number>;
    getHighestBlockHeight(): Promise<number>;
    setBlockCount(height: number): Promise<void>;
    countBlockRedundancy(height: number): Promise<number>;
    getBlock(height: number): Promise<object>;
    getTransaction(transactionId: string): Promise<object>;
    setBlock(height: number, block: object, options?: object): Promise<void>;
    pruneBlock(height: number, redundancySize: number): Promise<void>;
    analyzeBlocks(startHeight: number, endHeight: number): Promise<object[]>;
    getBlockMetaCount(): Promise<number>;
    getHighestBlockMetaHeight(): Promise<number>;
    getHighestBlockMeta(): Promise<object | undefined>;
    setBlockMeta(blockMeta: object): Promise<void>;
    setTransactionMeta(transactionMeta: object): Promise<void>;
    analyzeBlockMetas(startHeight: number, endHeight: number): Promise<object[]>;
    removeBlockMetaByHeight(height: number): Promise<void>;
    close(): Promise<void>;
    private setReady;
    private validateOptionalParameters;
}
