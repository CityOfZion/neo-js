"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const constants_1 = __importDefault(require("../common/constants"));
const neo_validator_1 = require("../validators/neo-validator");
const MODULE_NAME = 'Api';
const DEFAULT_OPTIONS = {
    insertToStorage: true,
    checkReadyIntervalMs: 200,
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
        this.checkMeshAndStorageReady();
        this.on('storage:insert', this.storageInsertHandler.bind(this));
        this.logger.debug('constructor completes.');
    }
    getBlockCount() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlockCount triggered.');
            if (!this.storage) {
                this.logger.debug('No storage delegate detected.');
                return this.getBlockCountFromMesh();
            }
            let blockHeight;
            try {
                blockHeight = yield this.storage.getBlockCount();
                return blockHeight;
            }
            catch (err) {
            }
            this.logger.debug('Cannot find result from storage delegate, attempt to fetch from mesh instead...');
            blockHeight = yield this.getBlockCountFromMesh();
            this.logger.debug('Successfully fetch result from mesh.');
            this.emit('storage:insert', { method: constants_1.default.rpc.getblockcount, result: blockHeight });
            return blockHeight;
        });
    }
    getBlock(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlock triggered. height:', height);
            neo_validator_1.NeoValidator.validateHeight(height);
            if (!this.storage) {
                this.logger.debug('No storage delegate detected.');
                return this.getBlockFromMesh(height);
            }
            let block;
            try {
                block = yield this.storage.getBlock(height);
                return block;
            }
            catch (err) {
                this.logger.debug('Cannot find result from storage delegate. Error:', err.message);
            }
            this.logger.debug('Attempt to fetch from mesh instead...');
            const blockResponse = yield this.getBlockAndNodeMetaFromMesh(height);
            this.logger.debug('Successfully fetch result from mesh.');
            block = blockResponse.block;
            const nodeMeta = blockResponse.nodeMeta;
            this.emit('storage:insert', { method: constants_1.default.rpc.getblock, result: { height, block }, nodeMeta });
            return block;
        });
    }
    getTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlock triggered. transactionId:', transactionId);
            neo_validator_1.NeoValidator.validateTransactionId(transactionId);
            if (!this.storage) {
                this.logger.debug('No storage delegate detected.');
                return this.getTransactionFromMesh(transactionId);
            }
            let transaction;
            try {
                transaction = yield this.storage.getTransaction(transactionId);
                return transaction;
            }
            catch (err) {
                this.logger.debug('Cannot find result from storage delegate. Error:', err.message);
            }
            this.logger.debug('Attempt to fetch from mesh instead...');
            transaction = yield this.getTransactionFromMesh(transactionId);
            return transaction;
        });
    }
    close() {
        clearInterval(this.checkReadyIntervalId);
    }
    storageInsertHandler(payload) {
        if (!this.options.insertToStorage) {
            return;
        }
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
    checkMeshAndStorageReady() {
        this.logger.debug('checkMeshAndStorageReady triggered.');
        this.checkReadyIntervalId = setInterval(() => {
            const meshReady = this.mesh.isReady();
            const storageReady = this.storage ? this.storage.isReady() : true;
            if (meshReady && storageReady) {
                this.emit('ready');
                clearInterval(this.checkReadyIntervalId);
            }
        }, this.options.checkReadyIntervalMs);
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
            const source = payload.nodeMeta ? payload.nodeMeta.endpoint : 'api:storeBlock';
            this.storage.setBlock(height, block, { source });
        }
    }
    getBlockCountFromMesh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlockCountFromMesh triggered.');
            const highestNode = this.mesh.getHighestNode();
            if (highestNode && highestNode.blockHeight) {
                return highestNode.blockHeight;
            }
            else {
                throw new Error('Edge case not implemented.');
            }
        });
    }
    getBlockFromMesh(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlockFromMesh triggered.');
            const blockResponse = yield this.getBlockAndNodeMetaFromMesh(height);
            return blockResponse.block;
        });
    }
    getBlockAndNodeMetaFromMesh(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlockAndNodeMetaFromMesh triggered.');
            const highestNode = this.mesh.getHighestNode();
            if (highestNode && highestNode.blockHeight) {
                const nodeMeta = highestNode.getNodeMeta();
                const block = yield highestNode.getBlock(height);
                return { block, nodeMeta };
            }
            else {
                throw new Error('Edge case not implemented.');
            }
        });
    }
    getTransactionFromMesh(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getTransactionFromMesh triggered.');
            const highestNode = this.mesh.getHighestNode();
            if (highestNode && highestNode.blockHeight) {
                const transaction = yield highestNode.getTransaction(transactionId);
                return transaction;
            }
            else {
                throw new Error('Edge case not implemented.');
            }
        });
    }
}
exports.Api = Api;
//# sourceMappingURL=api.js.map