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
    setBlockCount(height: number): Promise<void>;
    countBlockRedundancy(height: number): Promise<number>;
    getBlock(height: number): Promise<object>;
    setBlock(height: number, block: object, options?: object): Promise<void>;
    pruneBlock(height: number, redundancySize: number): Promise<void>;
    analyzeBlocks(startHeight: number, endHeight: number): Promise<object[]>;
    disconnect(): Promise<void>;
    private validateOptionalParameters;
}
