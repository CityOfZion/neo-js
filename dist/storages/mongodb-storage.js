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
const mongoose_1 = require("mongoose");
const mongodb_validator_1 = require("../validators/mongodb-validator");
const block_dao_1 = require("./mongodb/block-dao");
const block_meta_dao_1 = require("./mongodb/block-meta-dao");
const mongoose = new mongoose_1.Mongoose();
mongoose.Promise = global.Promise;
const MODULE_NAME = 'MongodbStorage';
const DEFAULT_OPTIONS = {
    connectOnInit: true,
    reviewIndexesOnConnect: false,
    userAgent: 'Unknown',
    collectionNames: {
        blocks: 'blocks',
        blockMetas: 'block_metas',
        transactions: 'transactions',
        assets: 'assets',
    },
    loggerOptions: {},
};
class MongodbStorage extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this._isReady = false;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.blockDao = new block_dao_1.BlockDao(mongoose, this.options.collectionNames.blocks);
        this.blockMetaDao = new block_meta_dao_1.BlockMetaDao(mongoose, this.options.collectionNames.blockMetas);
        this.initConnection();
        this.on('ready', this.readyHandler.bind(this));
        this.logger.debug('constructor completes.');
    }
    isReady() {
        return this._isReady;
    }
    getBlockCount() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlockCount triggered.');
            return yield this.blockDao.getHighestHeight();
        });
    }
    setBlockCount(height) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    countBlockRedundancy(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('countBlockRedundancy triggered. height:', height);
            return yield this.blockDao.countByHeight(height);
        });
    }
    getBlock(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlock triggered. height:', height);
            const doc = this.blockDao.getByHeight(height);
            if (!doc) {
                throw new Error('No document found.');
            }
            if (!doc.payload) {
                throw new Error('Invalid document result.');
            }
            return doc.payload;
        });
    }
    getBlocks(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlocks triggered. height:', height);
            const docs = yield this.blockDao.listByHeight(height);
            if (docs.length === 0) {
                return [];
            }
            const blocks = lodash_1.map(docs, (doc) => doc.payload);
            return blocks;
        });
    }
    getTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getTransaction triggered.');
            const doc = yield this.blockDao.getByTransactionId(transactionId);
            if (!doc) {
                throw new Error('No result found.');
            }
            const transaction = lodash_1.find(doc.payload.tx, (t) => t.txid === transactionId);
            return transaction;
        });
    }
    setBlock(height, block, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('setBlock triggered.');
            const data = {
                height,
                source: options.source,
                userAgent: options.userAgent,
                createdBy: this.options.userAgent,
                payload: block,
            };
            yield this.blockDao.save(data);
        });
    }
    pruneBlock(height, redundancySize) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('pruneBlock triggered. height: ', height, 'redundancySize:', redundancySize);
            const docs = yield this.blockDao.listByHeight(height);
            this.logger.debug('blockDao.listByHeight() succeed. docs.length:', docs.length);
            if (docs.length > redundancySize) {
                const takeCount = docs.length - redundancySize;
                const toPrune = lodash_1.takeRight(docs, takeCount);
                toPrune.forEach((doc) => __awaiter(this, void 0, void 0, function* () {
                    this.logger.debug('Removing document id:', doc._id);
                    try {
                        yield this.blockDao.removeById(doc._id);
                        this.logger.debug('blockModel.remove() execution succeed.');
                    }
                    catch (err) {
                        this.logger.debug('blockModel.remove() execution failed. error:', err.message);
                    }
                }));
            }
        });
    }
    analyzeBlocks(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('analyzeBlockHeight triggered.');
            return yield this.blockDao.analyze(startHeight, endHeight);
        });
    }
    getBlockMetaCount() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getBlockMetaCount triggered.');
            return yield this.blockMetaDao.count();
        });
    }
    getHighestBlockMetaHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('getHighestBlockMetaHeight triggered.');
            return yield this.blockMetaDao.getHighestHeight();
        });
    }
    setBlockMeta(blockMeta) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('setBlockMeta triggered.');
            const data = Object.assign({ createdBy: this.options.userAgent }, blockMeta);
            return yield this.blockMetaDao.save(data);
        });
    }
    analyzeBlockMetas(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('analyzeBlockMetas triggered.');
            return yield this.blockMetaDao.analyze(startHeight, endHeight);
        });
    }
    removeBlockMetaByHeight(height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('removeBlockMetaByHeight triggered. height: ', height);
            return yield this.blockMetaDao.removeByHeight(height);
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('disconnect triggered.');
            return yield mongoose.disconnect();
        });
    }
    readyHandler(payload) {
        this.logger.debug('readyHandler triggered.');
        if (this.options.reviewIndexesOnConnect) {
            this.reviewIndexes();
        }
    }
    validateOptionalParameters() {
    }
    initConnection() {
        if (this.options.connectOnInit) {
            this.logger.debug('initConnection triggered.');
            mongodb_validator_1.MongodbValidator.validateConnectionString(this.options.connectionString);
            mongoose
                .connect(this.options.connectionString, { useMongoClient: true })
                .then(() => {
                this.logger.info('MongoDB connected.');
                this.setReady();
            })
                .catch((err) => {
                this.logger.error('Error establish MongoDB connection.');
                throw err;
            });
        }
    }
    setReady() {
        this._isReady = true;
        this.emit('ready');
    }
    reviewIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('Proceed to review indexes...');
            this.emit('reviewIndexes:init');
            try {
                yield this.reviewIndexForBlockHeight();
                yield this.reviewIndexForTransactionId();
                this.logger.debug('Review indexes succeed.');
                this.emit('reviewIndexes:complete', { isSuccess: true });
            }
            catch (err) {
                this.logger.debug('reviewIndexes failed. Message:', err.message);
                this.emit('reviewIndexes:complete', { isSuccess: false });
            }
        });
    }
    reviewIndexForBlockHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('reviewIndexForBlockHeight triggered.');
            const key = 'height_1_createdAt_-1';
            const keyObj = { height: 1, createdAt: -1 };
            return yield this.blockDao.reviewIndex(key, keyObj);
        });
    }
    reviewIndexForTransactionId() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('reviewIndexForTransactionId triggered.');
            const key = 'payload.tx.txid_1';
            const keyObj = { 'payload.tx.txid': 1 };
            return yield this.blockDao.reviewIndex(key, keyObj);
        });
    }
}
exports.MongodbStorage = MongodbStorage;
//# sourceMappingURL=mongodb-storage.js.map