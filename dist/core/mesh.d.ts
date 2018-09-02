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
    private performBenchmark;
    private checkMeshReady;
    private setReady;
    getFastestNode(activeOnly?: boolean): Node | undefined;
    getHighestNode(activeOnly?: boolean): Node | undefined;
    /**
     * @param activeOnly Toggle to only pick node that is determined to be active.
     */
    getRandomNode(activeOnly?: boolean): Node | undefined;
    private listActiveNodes;
}
