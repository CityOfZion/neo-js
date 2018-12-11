/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { Mesh, MeshOptions } from './core/mesh';
import { NodeOptions } from './core/node';
import { Api, ApiOptions } from './core/api';
import { Syncer, SyncerOptions } from './core/syncer';
import { MemoryStorage, MemoryStorageOptions } from './storages/memory-storage';
import { MongodbStorage, MongodbStorageOptions } from './storages/mongodb-storage';
import { BlockAnalyzer, BlockAnalyzerOptions } from './analyzers/block-analyzer';
export interface NeoOptions {
    network?: string;
    storageType?: string;
    endpoints?: object[];
    enableSyncer?: boolean;
    enableBlockAnalyzer?: boolean;
    nodeOptions?: NodeOptions;
    meshOptions?: MeshOptions;
    storageOptions?: MemoryStorageOptions | MongodbStorageOptions;
    apiOptions?: ApiOptions;
    syncerOptions?: SyncerOptions;
    blockAnalyzerOptions?: BlockAnalyzerOptions;
    loggerOptions?: LoggerOptions;
}
export declare class Neo extends EventEmitter {
    mesh: Mesh;
    storage?: MemoryStorage | MongodbStorage;
    api: Api;
    syncer?: Syncer;
    blockAnalyzer?: BlockAnalyzer;
    private options;
    private logger;
    constructor(options?: NeoOptions);
    static readonly VERSION: string;
    static readonly UserAgent: string;
    close(): void;
    private validateOptionalParameters;
    private getMesh;
    private getStorage;
    private getApi;
    private getSyncer;
    private getBlockAnalyzer;
    private getNodes;
}
