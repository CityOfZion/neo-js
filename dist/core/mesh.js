"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const MODULE_NAME = 'Mesh';
const DEFAULT_OPTIONS = {
    startBenchmarkOnInit: true,
    toFetchUserAgent: true,
    benchmarkIntervalMs: 2000,
    fetchMissingUserAgentIntervalMs: 5000,
    refreshUserAgentIntervalMs: 5 * 60 * 1000,
    minActiveNodesRequired: 2,
    pendingRequestsThreshold: 5,
    loggerOptions: {},
};
class Mesh extends events_1.EventEmitter {
    constructor(nodes, options = {}) {
        super();
        this._isReady = false;
        this.nodes = nodes;
        if (this.nodes.length === 0) {
            throw new Error('Mesh must have 1 or more nodes.');
        }
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        if (this.options.startBenchmarkOnInit) {
            this.startBenchmark();
        }
        this.logger.debug('constructor completes.');
    }
    isReady() {
        return this._isReady;
    }
    startBenchmark() {
        this.logger.debug('startBenchmark triggered.');
        const unknownNodes = lodash_1.filter(this.nodes, (n) => n.isActive === undefined);
        this.logger.debug('unknownNodes.length:', unknownNodes.length);
        unknownNodes.forEach((n) => {
            n.getBlockCount()
                .then(() => {
                this.checkMeshReady();
            })
                .catch((err) => {
                this.logger.info('node.getBlockCount() failed, but to continue. Endpoint:', n.endpoint, 'Message:', err.message);
            });
        });
        if (this.options.toFetchUserAgent) {
            unknownNodes.forEach((n) => {
                n.getVersion().catch((err) => {
                    this.logger.info('node.getVersion() failed, but to continue. Endpoint:', n.endpoint, 'Message:', err.message);
                });
            });
            this.fetchMissingUserAgentIntervalId = setInterval(() => this.performFetchMissingUserAgent(), this.options.fetchMissingUserAgentIntervalMs);
            this.refreshUserAgentIntervalId = setInterval(() => this.performRefreshUserAgent(), this.options.refreshUserAgentIntervalMs);
        }
        this.benchmarkIntervalId = setInterval(() => this.performBenchmark(), this.options.benchmarkIntervalMs);
    }
    stopBenchmark() {
        this.logger.debug('stopBenchmark triggered.');
        if (this.benchmarkIntervalId) {
            clearInterval(this.benchmarkIntervalId);
        }
        if (this.fetchMissingUserAgentIntervalId) {
            clearInterval(this.fetchMissingUserAgentIntervalId);
        }
        if (this.refreshUserAgentIntervalId) {
            clearInterval(this.refreshUserAgentIntervalId);
        }
    }
    close() {
        this.logger.debug('close triggered.');
        this.stopBenchmark();
        this.nodes.forEach((n) => {
            n.close();
        });
    }
    getFastestNode(activeOnly = true) {
        this.logger.debug('getFastestNode triggered.');
        let nodePool = activeOnly ? this.listActiveNodes() : this.nodes;
        if (nodePool.length === 0) {
            return undefined;
        }
        nodePool = lodash_1.filter(nodePool, (n) => n.latency !== undefined);
        if (nodePool.length === 0) {
            return undefined;
        }
        return lodash_1.minBy(nodePool, 'latency');
    }
    getHighestNode(activeOnly = true) {
        this.logger.debug('getHighestNode triggered.');
        let nodePool = activeOnly ? this.listActiveNodes() : this.nodes;
        if (nodePool.length === 0) {
            return undefined;
        }
        nodePool = lodash_1.filter(nodePool, (n) => n.blockHeight !== undefined);
        if (nodePool.length === 0) {
            return undefined;
        }
        return lodash_1.maxBy(nodePool, 'blockHeight');
    }
    getRandomNode(activeOnly = true) {
        this.logger.debug('getRandomNode triggered.');
        const nodePool = activeOnly ? this.listActiveNodes() : this.nodes;
        if (nodePool.length === 0) {
            return undefined;
        }
        const randomIndex = lodash_1.random(0, nodePool.length - 1);
        return nodePool[randomIndex];
    }
    getOptimalNode(height, activeOnly = true) {
        this.logger.debug('getOptimalNode triggered.');
        const nodePool = activeOnly ? this.listActiveNodes() : this.nodes;
        if (nodePool.length === 0) {
            return undefined;
        }
        const qualifyHeightNodes = lodash_1.filter(this.nodes, (n) => n.blockHeight !== undefined && n.blockHeight >= height);
        if (qualifyHeightNodes.length === 0) {
            return undefined;
        }
        const qualifyPendingNodes = lodash_1.filter(qualifyHeightNodes, (n) => !n.pendingRequests || n.pendingRequests <= this.options.pendingRequestsThreshold);
        if (qualifyPendingNodes.length === 0) {
            const randomIndex = lodash_1.random(0, qualifyHeightNodes.length - 1);
            return qualifyHeightNodes[randomIndex];
        }
        return lodash_1.minBy(qualifyPendingNodes, 'latency');
    }
    validateOptionalParameters() {
    }
    performBenchmark() {
        this.logger.debug('performBenchmark triggered.');
        const node = this.getNodeToBenchmark();
        if (node) {
            node.getBlockCount().catch((err) => {
                this.logger.info('node.getBlockCount error in performBenchmark(). Endpoint:', node.endpoint, 'Message:', err.message);
            });
        }
        else {
            this.logger.info('Unable to find a suitable node to perform benchmark.');
        }
    }
    getNodeToBenchmark() {
        this.logger.debug('getNodeToBenchmark triggered.');
        const nodePool = lodash_1.filter(this.nodes, (n) => !n.isBenchmarking);
        if (nodePool.length === 0) {
            return undefined;
        }
        const unknownNode = lodash_1.find(nodePool, (n) => n.lastPingTimestamp === undefined);
        if (unknownNode) {
            return unknownNode;
        }
        const targetNode = lodash_1.minBy(nodePool, (n) => n.lastPingTimestamp);
        return targetNode;
    }
    performFetchMissingUserAgent() {
        this.logger.debug('performBenchmark triggered.');
        const nodePool = lodash_1.filter(this.nodes, (n) => n.userAgent === undefined);
        nodePool.forEach((n) => {
            n.getVersion().catch((err) => {
                this.logger.info('node.getVersion() failed, but to continue. Endpoint:', n.endpoint, 'Message:', err.message);
            });
        });
    }
    performRefreshUserAgent() {
        this.logger.debug('performRefreshUserAgent triggered.');
        this.nodes.forEach((n) => {
            n.getVersion().catch((err) => {
                this.logger.info('node.getVersion() failed, but to continue. Endpoint:', n.endpoint, 'Message:', err.message);
            });
        });
    }
    checkMeshReady() {
        this.logger.debug('checkMeshReady triggered.');
        const activeNodes = this.listActiveNodes();
        if (!this.options.minActiveNodesRequired || activeNodes.length >= this.options.minActiveNodesRequired) {
            if (!this._isReady) {
                this.setReady();
                this.logger.debug('mesh is considered to be now ready.');
            }
        }
    }
    setReady() {
        this._isReady = true;
        this.emit('ready');
    }
    listActiveNodes() {
        return lodash_1.filter(this.nodes, { isActive: true });
    }
}
exports.Mesh = Mesh;
//# sourceMappingURL=mesh.js.map