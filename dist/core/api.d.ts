/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { Mesh } from './mesh';
import { MemoryStorage } from '../storages/memory-storage';
import { MongodbStorage } from '../storages/mongodb-storage';
export interface ApiOptions {
    insertToStorage?: boolean;
    checkReadyIntervalMs?: number;
    loggerOptions?: LoggerOptions;
}
export declare class Api extends EventEmitter {
    private mesh;
    private storage?;
    private options;
    private logger;
    private checkReadyIntervalId?;
    constructor(mesh: Mesh, storage?: MemoryStorage | MongodbStorage, options?: ApiOptions);
    getBlockCount(): Promise<number>;
    getBlock(height: number): Promise<object>;
    getTransaction(transactionId: string): Promise<object>;
    close(): void;
    private storageInsertHandler;
    private validateOptionalParameters;
    private checkMeshAndStorageReady;
    private storeBlockCount;
    private storeBlock;
    private getBlockCountFromMesh;
    private getBlockFromMesh;
    private getBlockAndNodeMetaFromMesh;
    private getTransactionFromMesh;
}
