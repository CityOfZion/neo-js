/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { MemoryStorage } from '../storages/memory-storage';
import { MongodbStorage } from '../storages/mongodb-storage';
export interface BlockAnalyzerOptions {
    minHeight?: number;
    maxHeight?: number;
    startOnInit?: boolean;
    blockQueueConcurrency?: number;
    enqueueEvaluateBlockIntervalMs?: number;
    verifyBlockMetasIntervalMs?: number;
    maxQueueLength?: number;
    standardEvaluateBlockPriority?: number;
    missingEvaluateBlockPriority?: number;
    loggerOptions?: LoggerOptions;
}
export declare class BlockAnalyzer extends EventEmitter {
    private blockMetaApiLevel;
    private _isRunning;
    private blockQueue;
    private blockWritePointer;
    private storage?;
    private options;
    private logger;
    private enqueueEvaluateBlockIntervalId?;
    private blockMetaVerificationIntervalId?;
    private isVerifyingBlockMetas;
    constructor(storage?: MemoryStorage | MongodbStorage, options?: BlockAnalyzerOptions);
    isRunning(): boolean;
    start(): void;
    stop(): void;
    close(): void;
    private validateOptionalParameters;
    private getPriorityQueue;
    private initEvaluateBlock;
    private setBlockWritePointer;
    private initBlockMetaVerification;
    private doBlockMetaVerification;
    private doEnqueueEvaluateBlock;
    private isReachedMaxHeight;
    private isReachedMaxQueueLength;
    private increaseBlockWritePointer;
    private enqueueEvaluateBlock;
    private evaluateBlock;
}
