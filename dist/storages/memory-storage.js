"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('getBlockCount() method is deprecated. Please use getHighestBlockHeight() instead.');
        });
    }
    getHighestBlockHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._blockHeight) {
                return this._blockHeight;
            }
            else {
                throw new Error('blockHeight unavailable');
            }
        });
    }
    setBlockCount(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this._blockHeight = height;
        });
    }
    countBlockRedundancy(height) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    getBlock(height) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockItem = lodash_1.find(this.blockCollection, { height });
            if (blockItem) {
                return blockItem.block;
            }
            else {
                throw new Error('Block not found.');
            }
        });
    }
    getTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    setBlock(height, block, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.blockCollection.push({ height, block });
        });
    }
    pruneBlock(height, redundancySize) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    analyzeBlocks(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    getBlockMetaCount() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    getHighestBlockMetaHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    getHighestBlockMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    setBlockMeta(blockMeta) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    setTransactionMeta(transactionMeta) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    analyzeBlockMetas(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    analyzeTransactionMetas(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    removeBlockMetaByHeight(height) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    pruneLegacyTransactionMeta(targetApiVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('close triggered.');
        });
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