"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const mongoose_1 = require("mongoose");
const mongoose = new mongoose_1.Mongoose();
mongoose.Promise = global.Promise;
const MODULE_NAME = 'MongodbStorage';
const DEFAULT_OPTIONS = {
    connectOnInit: true,
    userAgent: 'Unknown',
    collectionNames: {
        blocks: 'blocks',
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
        this.initConnection();
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
    setBlock(height, block, source) {
        this.logger.debug('setBlock triggered.');
        const data = {
            height,
            source,
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
    disconnect() {
        this.logger.debug('disconnect triggered.');
        return mongoose.disconnect();
    }
    validateOptionalParameters() {
    }
    getBlockModel() {
        const schema = new mongoose_1.Schema({
            height: Number,
            createdBy: String,
            source: String,
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
    initConnection() {
        if (this.options.connectOnInit) {
            this.logger.debug('initConnection triggered.');
            mongoose
                .connect(this.options.connectionString, { useMongoClient: true })
                .then(() => {
                this.setReady();
                this.logger.info('mongoose connected.');
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
}
exports.MongodbStorage = MongodbStorage;
//# sourceMappingURL=mongodb-storage.js.map