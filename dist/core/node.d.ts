/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
export interface NodeOptions {
    toBenchmark?: boolean;
    loggerOptions?: LoggerOptions;
}
export declare class Node extends EventEmitter {
    isActive: boolean | undefined;
    pendingRequests: number;
    latency: number | undefined;
    blockHeight: number | undefined;
    lastSeenTimestamp: number | undefined;
    endpoint: string;
    private options;
    private logger;
    constructor(endpoint: string, options?: NodeOptions);
    getBlock(height: number, isVerbose?: boolean): Promise<object>;
    getBlockCount(): Promise<object>;
    getVersion(): Promise<object>;
    private queryInitHandler;
    private querySuccessHandler;
    private queryFailedHandler;
    private validateOptionalParameters;
    private query;
    private increasePendingRequest;
    private decreasePendingRequest;
}
