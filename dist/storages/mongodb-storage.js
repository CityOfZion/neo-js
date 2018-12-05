"use strict";
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
        this.logger.debug('getBlockCount triggered.');
        return this.blockDao.getHighestHeight();
    }
    setBlockCount(height) {
        throw new Error('Not implemented.');
    }
    countBlockRedundancy(height) {
        this.logger.debug('countBlockRedundancy triggered. height:', height);
        return this.blockDao.countByHeight(height);
    }
    getBlock(height) {
        this.logger.debug('getBlock triggered. height:', height);
        return new Promise((resolve, reject) => {
            this.blockDao
                .getByHeight(height)
                .then((doc) => {
                if (!doc) {
                    return reject(new Error('No document found.'));
                }
                if (!doc.payload) {
                    return reject(new Error('Invalid document result.'));
                }
                return resolve(doc.payload);
            })
                .catch((err) => reject(err));
        });
    }
    getBlocks(height) {
        this.logger.debug('getBlocks triggered. height:', height);
        return new Promise((resolve, reject) => {
            this.blockDao
                .listByHeight(height)
                .then((docs) => {
                if (docs.length === 0) {
                    return resolve([]);
                }
                const result = lodash_1.map(docs, (item) => item.payload);
                return resolve(result);
            })
                .catch((err) => reject(err));
        });
    }
    getTransaction(transactionId) {
        this.logger.debug('getTransaction triggered.');
        return new Promise((resolve, reject) => {
            this.blockDao
                .getByTransactionId(transactionId)
                .then((doc) => {
                if (!doc) {
                    return reject(new Error('No result found.'));
                }
                const transaction = lodash_1.find(doc.payload.tx, (t) => t.txid === transactionId);
                return resolve(transaction);
            })
                .catch((err) => reject(err));
        });
    }
    setBlock(height, block, options = {}) {
        this.logger.debug('setBlock triggered.');
        const data = {
            height,
            source: options.source,
            userAgent: options.userAgent,
            createdBy: this.options.userAgent,
            payload: block,
        };
        return new Promise((resolve, reject) => {
            this.blockDao
                .save(data)
                .then(() => resolve())
                .catch((err) => {
                this.logger.warn('blockDao.save() execution failed.');
                return reject(err);
            });
        });
    }
    pruneBlock(height, redundancySize) {
        this.logger.debug('pruneBlock triggered. height: ', height, 'redundancySize:', redundancySize);
        return new Promise((resolve, reject) => {
            this.blockDao
                .listByHeight(height)
                .then((docs) => {
                this.logger.debug('blockDao.listByHeight() succeed. docs.length:', docs.length);
                if (docs.length > redundancySize) {
                    const takeCount = docs.length - redundancySize;
                    const toPrune = lodash_1.takeRight(docs, takeCount);
                    toPrune.forEach((doc) => {
                        this.logger.debug('Removing document id:', doc._id);
                        this.blockDao
                            .removeById(doc._id)
                            .then(() => {
                            this.logger.debug('blockModel.remove() execution succeed.');
                        })
                            .catch((err) => {
                            this.logger.debug('blockModel.remove() execution failed. error:', err.message);
                        });
                    });
                }
                resolve();
            })
                .catch((err) => reject(err));
        });
    }
    analyzeBlocks(startHeight, endHeight) {
        this.logger.debug('analyzeBlockHeight triggered.');
        return this.blockDao.analyze(startHeight, endHeight);
    }
    getBlockMetaCount() {
        this.logger.debug('getBlockMetaCount triggered.');
        return this.blockMetaDao.count();
    }
    getHighestBlockMetaHeight() {
        this.logger.debug('getHighestBlockMetaHeight triggered.');
        return this.blockMetaDao.getHighestHeight();
    }
    setBlockMeta(blockMeta) {
        this.logger.debug('setBlockMeta triggered.');
        const data = Object.assign({ createdBy: this.options.userAgent }, blockMeta);
        return this.blockMetaDao.save(data);
    }
    analyzeBlockMetas(startHeight, endHeight) {
        this.logger.debug('analyzeBlockMetas triggered.');
        return this.blockMetaDao.analyze(startHeight, endHeight);
    }
    removeBlockMetaByHeight(height) {
        this.logger.debug('removeBlockMetaByHeight triggered. height: ', height);
        return this.blockMetaDao.removeByHeight(height);
    }
    disconnect() {
        this.logger.debug('disconnect triggered.');
        return mongoose.disconnect();
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
        this.logger.debug('Proceed to review indexes...');
        this.emit('reviewIndexes:init');
        return new Promise((resolve, reject) => {
            Promise.resolve()
                .then(() => this.reviewIndexForBlockHeight())
                .then(() => this.reviewIndexForTransactionId())
                .then(() => {
                this.logger.debug('Review indexes succeed.');
                this.emit('reviewIndexes:complete', { isSuccess: true });
                return resolve();
            })
                .catch((err) => {
                this.logger.debug('reviewIndexes failed. Message:', err.message);
                this.emit('reviewIndexes:complete', { isSuccess: false });
                return resolve();
            });
        });
    }
    reviewIndexForBlockHeight() {
        this.logger.debug('reviewIndexForBlockHeight triggered.');
        const key = 'height_1_createdAt_-1';
        const keyObj = { height: 1, createdAt: -1 };
        return this.blockDao.reviewIndex(key, keyObj);
    }
    reviewIndexForTransactionId() {
        this.logger.debug('reviewIndexForTransactionId triggered.');
        const key = 'payload.tx.txid_1';
        const keyObj = { 'payload.tx.txid': 1 };
        return this.blockDao.reviewIndex(key, keyObj);
    }
}
exports.MongodbStorage = MongodbStorage;
//# sourceMappingURL=mongodb-storage.js.map