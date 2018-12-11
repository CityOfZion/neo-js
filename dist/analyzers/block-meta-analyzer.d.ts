/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { MemoryStorage } from '../storages/memory-storage';
import { MongodbStorage } from '../storages/mongodb-storage';
export interface BlockMetaAnalyzerOptions {
    minHeight?: number;
    maxHeight?: number;
    startOnInit?: boolean;
    analyzeQueueConcurrency?: number;
    enqueueBlockIntervalMs?: number;
    verifyBlockMetasIntervalMs?: number;
    maxQueueLength?: number;
    standardEnqueueBlockPriority?: number;
    missingEnqueueBlockPriority?: number;
    loggerOptions?: LoggerOptions;
}
export declare class BlockMetaAnalyzer extends EventEmitter {
    private apiLevel;
    private _isRunning;
    private queue;
    private blockWritePointer;
    private storage?;
    private options;
    private logger;
    private enqueueAnalyzeBlockIntervalId?;
    private blockMetaVerificationIntervalId?;
    private isVerifyingBlockMetas;
    constructor(storage?: MemoryStorage | MongodbStorage, options?: BlockMetaAnalyzerOptions);
    isRunning(): boolean;
    start(): void;
    stop(): void;
    close(): void;
    private validateOptionalParameters;
    private getPriorityQueue;
    private initAnalyzeBlock;
    private setBlockWritePointer;
    private initBlockMetaVerification;
    private doBlockMetaVerification;
    private doEnqueueAnalyzeBlock;
    private isReachedMaxHeight;
    private isReachedMaxQueueLength;
    private increaseBlockWritePointer;
    private enqueueAnalyzeBlock;
    private analyzeBlock;
}
