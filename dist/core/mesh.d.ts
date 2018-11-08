/// <reference types="node" />
import { EventEmitter } from 'events';
import { LoggerOptions } from 'node-log-it';
import { Node } from './node';
export interface MeshOptions {
    startBenchmarkOnInit?: boolean;
    benchmarkIntervalMs?: number;
    minActiveNodesRequired?: number;
    loggerOptions?: LoggerOptions;
}
export declare class Mesh extends EventEmitter {
    nodes: Node[];
    private _isReady;
    private benchmarkIntervalId?;
    private options;
    private logger;
    constructor(nodes: Node[], options?: MeshOptions);
    isReady(): boolean;
    startBenchmark(): void;
    stopBenchmark(): void;
    getFastestNode(activeOnly?: boolean): Node | undefined;
    getHighestNode(activeOnly?: boolean): Node | undefined;
    getRandomNode(activeOnly?: boolean): Node | undefined;
    private validateOptionalParameters;
    private performBenchmark;
    private checkMeshReady;
    private setReady;
    private listActiveNodes;
}
