/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { Mesh } from './mesh';
import { MemoryStorage } from '../storages/memory-storage';
import { MongodbStorage } from '../storages/mongodb-storage';
export interface ApiOptions {
    loggerOptions?: LoggerOptions;
}
export declare class Api extends EventEmitter {
    private mesh;
    private storage?;
    private options;
    private logger;
    constructor(mesh: Mesh, storage?: MemoryStorage | MongodbStorage, options?: ApiOptions);
    getBlockCount(): Promise<number>;
    getBlock(height: number): Promise<object>;
    private storageInsertHandler;
    private validateOptionalParameters;
    private storeBlockCount;
    private storeBlock;
    private getBlockCountFromMesh;
    private getBlockFromMesh;
}
