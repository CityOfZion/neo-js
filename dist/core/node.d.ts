/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
export interface NodeMeta {
    isActive: boolean | undefined;
    pendingRequests: number | undefined;
    latency: number | undefined;
    blockHeight: number | undefined;
    lastSeenTimestamp: number | undefined;
    userAgent: string | undefined;
    endpoint: string;
}
export interface NodeOptions {
    toLogReliability?: boolean;
    truncateRequestLogIntervalMs?: number;
    requestLogTtl?: number;
    timeout?: number;
    loggerOptions?: LoggerOptions;
}
export declare class Node extends EventEmitter {
    isActive: boolean | undefined;
    pendingRequests: number | undefined;
    latency: number | undefined;
    blockHeight: number | undefined;
    lastPingTimestamp: number | undefined;
    lastSeenTimestamp: number | undefined;
    userAgent: string | undefined;
    endpoint: string;
    isBenchmarking: boolean;
    private options;
    private logger;
    private requestLogs;
    private truncateRequestLogIntervalId?;
    constructor(endpoint: string, options?: NodeOptions);
    getBlock(height: number, isVerbose?: boolean): Promise<object>;
    getBlockCount(): Promise<object>;
    getVersion(): Promise<object>;
    getNodeMeta(): NodeMeta;
    getNodeReliability(): number | undefined;
    getShapedLatency(): number | undefined;
    close(): void;
    private queryInitHandler;
    private queryCompleteHandler;
    private validateOptionalParameters;
    private startBenchmark;
    private stopBenchmark;
    private truncateRequestLog;
    private query;
    private increasePendingRequest;
    private decreasePendingRequest;
    private getRequestConfig;
}
