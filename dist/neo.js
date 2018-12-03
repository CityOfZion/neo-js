"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const mesh_1 = require("./core/mesh");
const node_1 = require("./core/node");
const api_1 = require("./core/api");
const syncer_1 = require("./core/syncer");
const memory_storage_1 = require("./storages/memory-storage");
const mongodb_storage_1 = require("./storages/mongodb-storage");
const block_meta_analyzer_1 = require("./analyzers/block-meta-analyzer");
const endpoint_validator_1 = require("./validators/endpoint-validator");
const profiles_1 = __importDefault(require("./common/profiles"));
const constants_1 = __importDefault(require("./common/constants"));
const version = require('../package.json').version;
const MODULE_NAME = 'Neo';
const DEFAULT_OPTIONS = {
    network: constants_1.default.network.testnet,
    enableBlockMetaAnalyzer: false,
    loggerOptions: {},
};
class Neo extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.logger.info('Version:', Neo.VERSION);
        this.mesh = this.getMesh();
        this.storage = this.getStorage();
        this.api = this.getApi();
        this.syncer = this.getSyncer();
        this.blockMetaAnalyzer = this.getBlockMetaAnalyzer();
        this.logger.debug('constructor completes.');
    }
    static get VERSION() {
        return version;
    }
    static get UserAgent() {
        return `NEO-JS:${Neo.VERSION}`;
    }
    close() {
        this.logger.debug('close triggered.');
        if (this.syncer) {
            this.syncer.stop();
        }
        if (this.mesh) {
            this.mesh.close();
        }
        if (this.storage) {
            this.storage.disconnect();
        }
        if (this.blockMetaAnalyzer) {
            this.blockMetaAnalyzer.stop();
        }
    }
    validateOptionalParameters() {
    }
    getMesh() {
        this.logger.debug('getMesh triggered.');
        const nodes = this.getNodes();
        return new mesh_1.Mesh(nodes, this.options.meshOptions);
    }
    getStorage() {
        this.logger.debug('getStorage triggered.');
        if (!this.options.storageType) {
            return undefined;
        }
        else if (this.options.storageType === constants_1.default.storage.memory) {
            return new memory_storage_1.MemoryStorage(this.options.storageOptions);
        }
        else if (this.options.storageType === constants_1.default.storage.mongodb) {
            const mongoStorageOptions = lodash_1.merge({}, this.options.storageOptions, { userAgent: Neo.UserAgent });
            return new mongodb_storage_1.MongodbStorage(mongoStorageOptions);
        }
        else {
            throw new Error(`Unknown storageType [${this.options.storageType}]`);
        }
    }
    getApi() {
        this.logger.debug('getApi triggered.');
        return new api_1.Api(this.mesh, this.storage, this.options.apiOptions);
    }
    getSyncer() {
        this.logger.debug('getSyncer triggered.');
        return new syncer_1.Syncer(this.mesh, this.storage, this.options.syncerOptions);
    }
    getBlockMetaAnalyzer() {
        this.logger.debug('getBlockMetaAnalyzer triggered.');
        if (this.options.enableBlockMetaAnalyzer) {
            return new block_meta_analyzer_1.BlockMetaAnalyzer(this.storage, this.options.blockMetaAnalyzerOptions);
        }
        else {
            return undefined;
        }
    }
    getNodes() {
        this.logger.debug('getNodes triggered.');
        let endpoints = [];
        if (this.options.endpoints) {
            endpoint_validator_1.EndpointValidator.validateArray(this.options.endpoints);
            endpoints = this.options.endpoints;
        }
        else if (this.options.network === constants_1.default.network.testnet) {
            endpoints = profiles_1.default.rpc.testnet;
        }
        else if (this.options.network === constants_1.default.network.mainnet) {
            endpoints = profiles_1.default.rpc.mainnet;
        }
        else {
            throw new Error('Invalid network or provided endpoints.');
        }
        const nodes = [];
        endpoints.forEach((item) => {
            const endpoint = item.endpoint;
            const node = new node_1.Node(endpoint, this.options.nodeOptions);
            nodes.push(node);
        });
        return nodes;
    }
}
exports.Neo = Neo;
//# sourceMappingURL=neo.js.map