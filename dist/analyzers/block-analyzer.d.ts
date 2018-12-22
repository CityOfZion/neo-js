/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { MemoryStorage } from '../storages/memory-storage';
import { MongodbStorage } from '../storages/mongodb-storage';
export interface BlockAnalyzerOptions {
    minHeight?: number;
    maxHeight?: number;
    startOnInit?: boolean;
    toEvaluateTransactions?: boolean;
    toEvaluateAssets?: boolean;
    blockQueueConcurrency?: number;
    transactionQueueConcurrency?: number;
    enqueueEvaluateBlockIntervalMs?: number;
    verifyBlocksIntervalMs?: number;
    maxBlockQueueLength?: number;
    maxTransactionQueueLength?: number;
    standardEvaluateBlockPriority?: number;
    missingEvaluateBlockPriority?: number;
    standardEvaluateTransactionPriority?: number;
    loggerOptions?: LoggerOptions;
}
export declare class BlockAnalyzer extends EventEmitter {
    private BLOCK_META_API_LEVEL;
    private TRANSACTION_META_API_LEVEL;
    private _isRunning;
    private blockQueue;
    private transactionQueue;
    private blockWritePointer;
    private storage?;
    private options;
    private logger;
    private enqueueEvaluateBlockIntervalId?;
    private blockVerificationIntervalId?;
    private isVerifyingBlocks;
    constructor(storage?: MemoryStorage | MongodbStorage, options?: BlockAnalyzerOptions);
    isRunning(): boolean;
    start(): void;
    stop(): void;
    close(): void;
    private validateOptionalParameters;
    private getPriorityQueue;
    private initEvaluateBlock;
    private setBlockWritePointer;
    private initBlockVerification;
    private doBlockVerification;
    private doEnqueueEvaluateBlock;
    private isReachedMaxHeight;
    private isReachedMaxQueueLength;
    private increaseBlockWritePointer;
    private enqueueEvaluateBlock;
    private evaluateBlock;
    private enqueueEvaluateTransaction;
    private evaluateTransaction;
}
