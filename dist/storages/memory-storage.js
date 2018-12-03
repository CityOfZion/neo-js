"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const MODULE_NAME = 'MemoryStorage';
const DEFAULT_OPTIONS = {
    loggerOptions: {},
};
class MemoryStorage extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this._isReady = false;
        this.blockCollection = [];
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.setReady();
        this.logger.debug('constructor completes.');
    }
    isReady() {
        return this._isReady;
    }
    getBlockCount() {
        if (this._blockHeight) {
            return Promise.resolve(this._blockHeight);
        }
        else {
            return Promise.reject(new Error('blockHeight unavailable'));
        }
    }
    setBlockCount(height) {
        this._blockHeight = height;
        return Promise.resolve();
    }
    countBlockRedundancy(height) {
        throw new Error('Not implemented.');
    }
    getBlock(height) {
        const blockItem = lodash_1.find(this.blockCollection, { height });
        if (blockItem) {
            return Promise.resolve(blockItem.block);
        }
        else {
            return Promise.reject(new Error('Block not found.'));
        }
    }
    getTransaction(transactionId) {
        throw new Error('Not implemented.');
    }
    setBlock(height, block, options = {}) {
        this.blockCollection.push({ height, block });
        return Promise.resolve();
    }
    pruneBlock(height, redundancySize) {
        throw new Error('Not implemented.');
    }
    analyzeBlocks(startHeight, endHeight) {
        throw new Error('Not implemented.');
    }
    getBlockMetaCount() {
        throw new Error('Not implemented.');
    }
    getHighestBlockMetaHeight() {
        throw new Error('Not implemented.');
    }
    getHighestBlockMeta() {
        throw new Error('Not implemented.');
    }
    setBlockMeta(blockMeta) {
        throw new Error('Not implemented.');
    }
    analyzeBlockMetas(startHeight, endHeight) {
        throw new Error('Not implemented.');
    }
    removeBlockMetaByHeight(height) {
        throw new Error('Not implemented.');
    }
    disconnect() {
        this.logger.debug('disconnect triggered.');
        return Promise.resolve();
    }
    setReady() {
        this._isReady = true;
        this.emit('ready');
    }
    validateOptionalParameters() {
    }
}
exports.MemoryStorage = MemoryStorage;
//# sourceMappingURL=memory-storage.js.map