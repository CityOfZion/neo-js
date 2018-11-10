"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const constants_1 = require("../common/constants");
const neo_validator_1 = require("../validators/neo-validator");
const MODULE_NAME = 'Api';
const DEFAULT_OPTIONS = {
    loggerOptions: {},
};
class Api extends events_1.EventEmitter {
    constructor(mesh, storage, options = {}) {
        super();
        this.mesh = mesh;
        this.storage = storage;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.on('storage:insert', this.storageInsertHandler.bind(this));
        this.logger.debug('constructor completes.');
    }
    getBlockCount() {
        this.logger.debug('getBlockCount triggered.');
        if (!this.storage) {
            this.logger.debug('No storage delegate detected.');
            return this.getBlockCountFromMesh();
        }
        return new Promise((resolve, reject) => {
            this.storage.getBlockCount()
                .then((blockHeight) => resolve(blockHeight))
                .catch((err) => {
                this.logger.debug('Cannot find result from storage delegate, attempt to fetch from mesh instead...');
                this.getBlockCountFromMesh()
                    .then((res) => {
                    this.logger.debug('Successfully fetch result from mesh.');
                    this.emit('storage:insert', { method: constants_1.default.rpc.getblockcount, result: res });
                    resolve(res);
                })
                    .catch((err2) => reject(err2));
            });
        });
    }
    getBlock(height) {
        this.logger.debug('getBlock triggered. height:', height);
        neo_validator_1.NeoValidator.validateHeight(height);
        if (!this.storage) {
            this.logger.debug('No storage delegate detected.');
            return this.getBlockFromMesh(height);
        }
        return new Promise((resolve, reject) => {
            this.storage.getBlock(height)
                .then((block) => resolve(block))
                .catch((err) => {
                this.logger.debug('Cannot find result from storage delegate. Error:', err.message);
                this.logger.debug('Attempt to fetch from mesh instead...');
                this.getBlockFromMesh(height)
                    .then((block) => {
                    this.logger.debug('Successfully fetch result from mesh.');
                    this.emit('storage:insert', { method: constants_1.default.rpc.getblock, result: { height, block } });
                    resolve(block);
                })
                    .catch((err2) => reject(err2));
            });
        });
    }
    storageInsertHandler(payload) {
        this.logger.debug('storageInsertHandler triggered.');
        if (payload.method === constants_1.default.rpc.getblockcount) {
            this.storeBlockCount(payload);
        }
        else if (payload.method === constants_1.default.rpc.getblock) {
            this.storeBlock(payload);
        }
        else {
            throw new Error('Not implemented.');
        }
    }
    validateOptionalParameters() {
    }
    storeBlockCount(payload) {
        if (this.storage) {
            const blockHeight = payload.result;
            this.storage.setBlockCount(blockHeight);
        }
    }
    storeBlock(payload) {
        if (this.storage) {
            const height = payload.result.height;
            const block = payload.result.block;
            const source = 'api:storeBlock';
            this.storage.setBlock(height, block, { source });
        }
    }
    getBlockCountFromMesh() {
        this.logger.debug('getBlockCountFromMesh triggered.');
        const highestNode = this.mesh.getHighestNode();
        if (highestNode && highestNode.blockHeight) {
            return Promise.resolve(highestNode.blockHeight);
        }
        else {
            return Promise.reject(new Error('Edge case not implemented.'));
        }
    }
    getBlockFromMesh(height) {
        this.logger.debug('getBlockFromMesh triggered.');
        const highestNode = this.mesh.getHighestNode();
        if (highestNode && highestNode.blockHeight) {
            return highestNode.getBlock(height);
        }
        else {
            return Promise.reject(new Error('Edge case not implemented.'));
        }
    }
}
exports.Api = Api;
//# sourceMappingURL=api.js.map