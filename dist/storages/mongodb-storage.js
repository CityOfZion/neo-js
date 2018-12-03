"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const mongoose_1 = require("mongoose");
const mongodb_validator_1 = require("../validators/mongodb-validator");
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
        this.blockModel = this.getBlockModel();
        this.blockMetaModel = this.getBlockMetaModel();
        this.initConnection();
        this.on('ready', this.readyHandler.bind(this));
        this.logger.debug('constructor completes.');
    }
    isReady() {
        return this._isReady;
    }
    getBlockCount() {
        this.logger.debug('getBlockCount triggered.');
        return new Promise((resolve, reject) => {
            this.blockModel
                .findOne({}, 'height')
                .sort({ height: -1 })
                .exec((err, res) => {
                if (err) {
                    this.logger.warn('blockModel.findOne() execution failed.');
                    return reject(err);
                }
                if (!res) {
                    this.logger.info('blockModel.findOne() executed by without response data, hence no blocks available.');
                    return resolve(0);
                }
                return resolve(res.height);
            });
        });
    }
    setBlockCount(height) {
        throw new Error('Not implemented.');
    }
    countBlockRedundancy(height) {
        this.logger.debug('countBlockRedundancy triggered. height:', height);
        return new Promise((resolve, reject) => {
            this.blockModel.count({ height }).exec((err, res) => {
                if (err) {
                    this.logger.warn('blockModel.count() execution failed. error:', err.message);
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    getBlock(height) {
        this.logger.debug('getBlock triggered. height:', height);
        return new Promise((resolve, reject) => {
            this.getBlockDocument(height)
                .then((doc) => {
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
            this.getBlockDocuments(height)
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
            this.getBlockDocumentByTransactionId(transactionId)
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
            this.blockModel(data).save((err) => {
                if (err) {
                    this.logger.warn('blockModel().save() execution failed.');
                    reject(err);
                }
                resolve();
            });
        });
    }
    pruneBlock(height, redundancySize) {
        this.logger.debug('pruneBlock triggered. height: ', height, 'redundancySize:', redundancySize);
        return new Promise((resolve, reject) => {
            this.getBlockDocuments(height)
                .then((docs) => {
                this.logger.debug('getBlockDocuments() succeed. docs.length:', docs.length);
                if (docs.length > redundancySize) {
                    const takeCount = docs.length - redundancySize;
                    const toPrune = lodash_1.takeRight(docs, takeCount);
                    toPrune.forEach((doc) => {
                        this.logger.debug('Removing document id:', doc._id);
                        this.blockModel.remove({ _id: doc._id }).exec((err, res) => {
                            if (err) {
                                this.logger.debug('blockModel.remove() execution failed. error:', err.message);
                            }
                            else {
                                this.logger.debug('blockModel.remove() execution succeed.');
                            }
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
        return new Promise((resolve, reject) => {
            const aggregatorOptions = [
                {
                    $group: {
                        _id: '$height',
                        count: { $sum: 1 },
                    },
                },
                {
                    $match: {
                        _id: {
                            $gte: startHeight,
                            $lte: endHeight,
                        },
                    },
                },
            ];
            this.blockModel
                .aggregate(aggregatorOptions)
                .allowDiskUse(true)
                .exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    getBlockMetaCount() {
        this.logger.debug('getBlockMetaCount triggered.');
        return new Promise((resolve, reject) => {
            this.blockMetaModel.count({}).exec((err, res) => {
                if (err) {
                    this.logger.warn('blockMetaModel.findOne() execution failed.');
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    getHighestBlockMetaHeight() {
        this.logger.debug('getHighestBlockMetaHeight triggered.');
        return new Promise((resolve, reject) => {
            this.getHighestBlockMeta()
                .then((res) => {
                if (res) {
                    return resolve(res.height);
                }
                return resolve(0);
            })
                .catch((err) => {
                return resolve(0);
            });
        });
    }
    getHighestBlockMeta() {
        this.logger.debug('getHighestBlockMeta triggered.');
        return new Promise((resolve, reject) => {
            this.blockMetaModel
                .findOne()
                .sort({ height: -1 })
                .exec((err, res) => {
                if (err) {
                    this.logger.warn('blockMetaModel.findOne() execution failed.');
                    return reject(err);
                }
                if (!res) {
                    this.logger.info('blockMetaModel.findOne() executed by without response data, hence no blocks available.');
                    return resolve(undefined);
                }
                return resolve(res);
            });
        });
    }
    setBlockMeta(blockMeta) {
        this.logger.debug('setBlockMeta triggered.');
        const data = Object.assign({ createdBy: this.options.userAgent }, blockMeta);
        return new Promise((resolve, reject) => {
            this.blockMetaModel(data).save((err) => {
                if (err) {
                    this.logger.info('blockMetaModel().save() execution failed.');
                    reject(err);
                }
                resolve();
            });
        });
    }
    analyzeBlockMetas(startHeight, endHeight) {
        this.logger.debug('analyzeBlockMetas triggered.');
        return new Promise((resolve, reject) => {
            this.blockMetaModel
                .find({
                height: {
                    $gte: startHeight,
                    $lte: endHeight,
                },
            }, 'height apiLevel')
                .exec((err, res) => {
                if (err) {
                    this.logger.warn('blockMetaModel.find() execution failed.');
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    removeBlockMetaByHeight(height) {
        this.logger.debug('removeBlockMetaByHeight triggered. height: ', height);
        return new Promise((resolve, reject) => {
            this.blockMetaModel.remove({ height }).exec((err, res) => {
                if (err) {
                    this.logger.debug('blockMetaModel.remove() execution failed. error:', err.message);
                    return reject(err);
                }
                else {
                    this.logger.debug('blockMetaModel.remove() execution succeed.');
                    return resolve();
                }
            });
        });
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
    getBlockModel() {
        const schema = new mongoose_1.Schema({
            height: Number,
            createdBy: String,
            source: String,
            userAgent: String,
            payload: {
                hash: String,
                size: Number,
                version: Number,
                previousblockhash: String,
                merkleroot: String,
                time: Number,
                index: { type: 'Number', required: true },
                nonce: String,
                nextconsensus: String,
                script: {
                    invocation: String,
                    verification: String,
                },
                tx: [],
                confirmations: Number,
                nextblockhash: String,
            },
        }, { timestamps: true });
        return mongoose.models[this.options.collectionNames.blocks] || mongoose.model(this.options.collectionNames.blocks, schema);
    }
    getBlockMetaModel() {
        const schema = new mongoose_1.Schema({
            height: { type: 'Number', unique: true, required: true, dropDups: true },
            time: Number,
            size: Number,
            generationTime: Number,
            transactionCount: Number,
            createdBy: String,
            apiLevel: Number,
        }, { timestamps: true });
        const name = this.options.collectionNames.blockMetas;
        return mongoose.models[name] || mongoose.model(name, schema);
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
        return this.reviewIndex(this.blockModel, key, keyObj);
    }
    reviewIndexForTransactionId() {
        this.logger.debug('reviewIndexForTransactionId triggered.');
        const key = 'payload.tx.txid_1';
        const keyObj = { 'payload.tx.txid': 1 };
        return this.reviewIndex(this.blockModel, key, keyObj);
    }
    reviewIndex(model, key, keyObj) {
        this.logger.debug('reviewIndex triggered.');
        return new Promise((resolve, reject) => {
            Promise.resolve()
                .then(() => this.hasIndex(model, key))
                .then((hasRequiredIndex) => {
                if (hasRequiredIndex) {
                    throw new Error('SKIP_INDEX');
                }
                this.logger.info(`Generating index [${key}]...`);
                return Promise.resolve();
            })
                .then(() => this.createIndex(model, keyObj))
                .then(() => {
                this.logger.info(`Index [${key}] generation complete.`);
                return resolve();
            })
                .catch((err) => {
                if (err.message === 'SKIP_INDEX') {
                    this.logger.info(`Index [${key}] already available. No action needed.`);
                    return resolve();
                }
                else {
                    this.logger.info(`Index [${key}] generation failed. Message:`, err.message);
                    return reject(err);
                }
            });
        });
    }
    hasIndex(model, key) {
        this.logger.debug('hasIndex triggered. key:', key);
        return new Promise((resolve, reject) => {
            model.collection
                .getIndexes()
                .then((res) => {
                this.logger.debug('collection.getIndexes succeed. res:', res);
                const keys = Object.keys(res);
                const result = lodash_1.includes(keys, key);
                return resolve(result);
            })
                .catch((err) => reject(err));
        });
    }
    createIndex(model, keyObj) {
        this.logger.debug('createIndex triggered.');
        return new Promise((resolve, reject) => {
            model.collection
                .createIndex(keyObj)
                .then((res) => resolve())
                .catch((err) => reject(err));
        });
    }
    getBlockDocument(height) {
        this.logger.debug('getBlockDocument triggered. height:', height);
        return new Promise((resolve, reject) => {
            this.blockModel
                .findOne({ height })
                .sort({ createdAt: -1 })
                .exec((err, res) => {
                if (err) {
                    this.logger.warn('blockModel.findOne() execution failed. error:', err.message);
                    return reject(err);
                }
                if (!res) {
                    return reject(new Error('No result found.'));
                }
                return resolve(res);
            });
        });
    }
    getBlockDocuments(height) {
        this.logger.debug('getBlockDocuments triggered. height:', height);
        return new Promise((resolve, reject) => {
            this.blockModel
                .find({ height })
                .sort({ createdAt: -1 })
                .exec((err, res) => {
                if (err) {
                    this.logger.warn('blockModel.find() execution failed. error:', err.message);
                    return reject(err);
                }
                if (!res) {
                    return resolve([]);
                }
                return resolve(res);
            });
        });
    }
    getBlockDocumentByTransactionId(transactionId) {
        this.logger.debug('getBlockDocumentByTransactionId triggered. transactionId:', transactionId);
        return new Promise((resolve, reject) => {
            this.blockModel
                .findOne({
                'payload.tx': {
                    $elemMatch: {
                        txid: transactionId,
                    },
                },
            })
                .exec((err, res) => {
                if (err) {
                    this.logger.warn('blockModel.findOne() execution failed. error:', err.message);
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
}
exports.MongodbStorage = MongodbStorage;
//# sourceMappingURL=mongodb-storage.js.map