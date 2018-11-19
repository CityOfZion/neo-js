"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const rpc_delegate_1 = require("../delegates/rpc-delegate");
const constants_1 = require("../common/constants");
const neo_validator_1 = require("../validators/neo-validator");
const MODULE_NAME = 'Node';
const DEFAULT_ID = 0;
const DEFAULT_OPTIONS = {
    toLogReliability: false,
    truncateRequestLogIntervalMs: 30 * 1000,
    requestLogTtl: 5 * 60 * 1000,
    timeout: 30000,
    loggerOptions: {},
};
class Node extends events_1.EventEmitter {
    constructor(endpoint, options = {}) {
        super();
        this.isBenchmarking = false;
        this.requestLogs = [];
        this.endpoint = endpoint;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        if (this.options.toLogReliability) {
            this.truncateRequestLogIntervalId = setInterval(() => this.truncateRequestLog(), this.options.truncateRequestLogIntervalMs);
        }
        this.on('query:init', this.queryInitHandler.bind(this));
        this.on('query:success', this.querySuccessHandler.bind(this));
        this.on('query:failed', this.queryFailedHandler.bind(this));
        this.logger.debug('constructor completes.');
    }
    getBlock(height, isVerbose = true) {
        this.logger.debug('getBlock triggered.');
        neo_validator_1.NeoValidator.validateHeight(height);
        const verboseKey = isVerbose ? 1 : 0;
        return this.query(constants_1.default.rpc.getblock, [height, verboseKey]);
    }
    getBlockCount() {
        this.logger.debug('getBlockCount triggered.');
        return this.query(constants_1.default.rpc.getblockcount);
    }
    getVersion() {
        this.logger.debug('getVersion triggered.');
        return this.query(constants_1.default.rpc.getversion);
    }
    getNodeMeta() {
        return {
            isActive: this.isActive,
            pendingRequests: this.pendingRequests,
            latency: this.latency,
            blockHeight: this.blockHeight,
            lastSeenTimestamp: this.lastSeenTimestamp,
            userAgent: this.userAgent,
            endpoint: this.endpoint,
        };
    }
    getNodeReliability() {
        const requestCount = this.requestLogs.length;
        if (requestCount === 0) {
            return undefined;
        }
        const successCount = lodash_1.filter(this.requestLogs, (logObj) => logObj.isSuccess === true).length;
        return successCount / requestCount;
    }
    getShapedLatency() {
        this.logger.debug('getShapedLatency triggered.');
        if (this.requestLogs.length === 0) {
            return this.latency;
        }
        const logPool = lodash_1.filter(this.requestLogs, (logObj) => logObj.isSuccess === true);
        const averageLatency = lodash_1.round(lodash_1.meanBy(logPool, (logObj) => logObj.latency), 0);
        return averageLatency;
    }
    close() {
        this.logger.debug('close triggered.');
        if (this.truncateRequestLogIntervalId) {
            clearInterval(this.truncateRequestLogIntervalId);
        }
    }
    queryInitHandler(payload) {
        this.logger.debug('queryInitHandler triggered.');
        this.startBenchmark(payload);
    }
    querySuccessHandler(payload) {
        this.logger.debug('querySuccessHandler triggered.');
        this.stopBenchmark(payload);
    }
    queryFailedHandler(payload) {
        this.logger.debug('queryFailedHandler triggered.');
        this.stopBenchmark(payload);
    }
    validateOptionalParameters() {
    }
    startBenchmark(payload) {
        this.logger.debug('startBenchmark triggered.');
        this.increasePendingRequest();
        if (payload.method === constants_1.default.rpc.getblockcount) {
            if (this.isBenchmarking) {
                this.logger.debug('An benchmarking schedule is already in place. Skipping... endpoint:', this.endpoint);
            }
            else {
                this.isBenchmarking = true;
            }
        }
    }
    stopBenchmark(payload) {
        this.logger.debug('stopBenchmark triggered.');
        this.decreasePendingRequest();
        this.lastPingTimestamp = Date.now();
        if (payload.error) {
            this.isActive = false;
        }
        else {
            this.isActive = true;
            this.lastSeenTimestamp = Date.now();
        }
        if (payload.blockHeight) {
            this.blockHeight = payload.blockHeight;
        }
        if (payload.userAgent) {
            this.userAgent = payload.userAgent;
        }
        if (payload.method === constants_1.default.rpc.getblockcount) {
            if (!this.isBenchmarking) {
                this.logger.debug('There are no running benchmarking schedule in place. Skipping... endpoint:', this.endpoint);
            }
            else {
                this.isBenchmarking = false;
                if (payload.latency) {
                    this.latency = payload.latency;
                }
                if (this.options.toLogReliability) {
                    if (payload.error) {
                        this.requestLogs.push({
                            timestamp: Date.now(),
                            isSuccess: false,
                        });
                    }
                    else {
                        this.requestLogs.push({
                            timestamp: Date.now(),
                            isSuccess: true,
                            latency: this.latency,
                        });
                    }
                }
            }
        }
    }
    truncateRequestLog() {
        this.logger.debug('truncateRequestLog triggered.');
        const cutOffTimestamp = Date.now() - this.options.requestLogTtl;
        this.requestLogs = lodash_1.remove(this.requestLogs, (logObj) => logObj.timestamp > cutOffTimestamp);
    }
    query(method, params = [], id = DEFAULT_ID) {
        this.logger.debug('query triggered. method:', method);
        this.emit('query:init', { method, params, id });
        const requestConfig = this.getRequestConfig();
        const t0 = Date.now();
        return new Promise((resolve, reject) => {
            rpc_delegate_1.RpcDelegate.query(this.endpoint, method, params, id, requestConfig)
                .then((res) => {
                const latency = Date.now() - t0;
                const result = res.result;
                const blockHeight = method === constants_1.default.rpc.getblockcount ? result : undefined;
                const userAgent = method === constants_1.default.rpc.getversion ? result.useragent : undefined;
                this.emit('query:success', { method, latency, blockHeight, userAgent });
                return resolve(result);
            })
                .catch((err) => {
                this.emit('query:failed', { method, error: err });
                return reject(err);
            });
        });
    }
    increasePendingRequest() {
        this.logger.debug('increasePendingRequest triggered.');
        if (this.pendingRequests) {
            this.pendingRequests += 1;
        }
        else {
            this.pendingRequests = 1;
        }
    }
    decreasePendingRequest() {
        this.logger.debug('decreasePendingRequest triggered.');
        if (this.pendingRequests) {
            this.pendingRequests -= 1;
        }
        else {
            this.pendingRequests = 0;
        }
    }
    getRequestConfig() {
        const config = {};
        if (this.options.timeout) {
            config.timeout = this.options.timeout;
        }
        return config;
    }
}
exports.Node = Node;
//# sourceMappingURL=node.js.map