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
    toBenchmark: true,
    loggerOptions: {},
};
class Node extends events_1.EventEmitter {
    constructor(endpoint, options = {}) {
        super();
        this.pendingRequests = 0;
        this.endpoint = endpoint;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
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
    queryInitHandler(payload) {
        this.logger.debug('queryInitHandler triggered.');
        if (this.options.toBenchmark) {
            this.increasePendingRequest();
        }
    }
    querySuccessHandler(payload) {
        this.logger.debug('querySuccessHandler triggered.');
        if (this.options.toBenchmark) {
            this.decreasePendingRequest();
            this.lastSeenTimestamp = Date.now();
            this.isActive = true;
            if (payload.latency) {
                this.latency = payload.latency;
            }
            if (payload.blockHeight) {
                this.blockHeight = payload.blockHeight;
            }
            if (payload.userAgent) {
                this.userAgent = payload.userAgent;
            }
        }
    }
    queryFailedHandler(payload) {
        this.logger.debug('queryFailedHandler triggered.');
        if (this.options.toBenchmark) {
            this.decreasePendingRequest();
            this.lastSeenTimestamp = Date.now();
            this.isActive = false;
        }
    }
    validateOptionalParameters() {
    }
    query(method, params = [], id = DEFAULT_ID) {
        this.logger.debug('query triggered. method:', method);
        this.emit('query:init', { method, params, id });
        const t0 = Date.now();
        return new Promise((resolve, reject) => {
            rpc_delegate_1.RpcDelegate.query(this.endpoint, method, params, id)
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
        this.pendingRequests += 1;
    }
    decreasePendingRequest() {
        this.logger.debug('decreasePendingRequest triggered.');
        this.pendingRequests -= 1;
    }
}
exports.Node = Node;
//# sourceMappingURL=node.js.map