/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { Mesh, MeshOptions } from './core/mesh';
import { NodeOptions } from './core/node';
import { Api, ApiOptions } from './core/api';
import { Syncer, SyncerOptions } from './core/syncer';
import { MemoryStorage, MemoryStorageOptions } from './storages/memory-storage';
import { MongodbStorage, MongodbStorageOptions } from './storages/mongodb-storage';
export interface NeoOptions {
    network?: string;
    storageType?: string;
    endpoints?: object[];
    nodeOptions?: NodeOptions;
    meshOptions?: MeshOptions;
    storageOptions?: MemoryStorageOptions | MongodbStorageOptions;
    apiOptions?: ApiOptions;
    syncerOptions?: SyncerOptions;
    loggerOptions?: LoggerOptions;
}
export declare class Neo extends EventEmitter {
    mesh: Mesh;
    storage?: MemoryStorage | MongodbStorage;
    api: Api;
    syncer: Syncer;
    private options;
    private logger;
    constructor(options?: NeoOptions);
    static readonly VERSION: string;
    readonly VERSION: string;
    private getMesh;
    private getStorage;
    private getApi;
    private getSyncer;
    private getNodes;
    close(): void;
}
