"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schemas_1 = require("./schemas");
const utils_1 = require("./utils");
class BlockDao {
    constructor(mongoose, collectionName) {
        this.model = this.getModel(mongoose, collectionName);
    }
    countByHeight(height) {
        return new Promise((resolve, reject) => {
            this.model.count({ height }).exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    getHighestHeight() {
        return new Promise((resolve, reject) => {
            this.model
                .findOne({}, 'height')
                .sort({ height: -1 })
                .exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                if (!res) {
                    return resolve(0);
                }
                return resolve(res.height);
            });
        });
    }
    getByHeight(height) {
        return new Promise((resolve, reject) => {
            this.model
                .findOne({ height })
                .sort({ createdAt: -1 })
                .exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    listByHeight(height) {
        return new Promise((resolve, reject) => {
            this.model
                .find({ height })
                .sort({ createdAt: -1 })
                .exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                if (!res) {
                    return resolve([]);
                }
                return resolve(res);
            });
        });
    }
    getByTransactionId(transactionId) {
        return new Promise((resolve, reject) => {
            this.model
                .findOne({
                'payload.tx': {
                    $elemMatch: {
                        txid: transactionId,
                    },
                },
            })
                .exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    save(data) {
        return new Promise((resolve, reject) => {
            this.model(data).save((err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
    removeById(id) {
        return new Promise((resolve, reject) => {
            this.model.remove({ _id: id }).exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    analyze(startHeight, endHeight) {
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
            this.model
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
    reviewIndex(key, keyObj) {
        return utils_1.MongodbUtils.reviewIndex(this.model, key, keyObj);
    }
    getModel(mongoose, collectionName) {
        const schema = schemas_1.blockSchema;
        return mongoose.models[collectionName] || mongoose.model(collectionName, schema);
    }
}
exports.BlockDao = BlockDao;
//# sourceMappingURL=block-dao.js.map