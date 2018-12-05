"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schemas_1 = require("./schemas");
class BlockMetaDao {
    constructor(mongoose, collectionName) {
        this.model = this.getModel(mongoose, collectionName);
    }
    count() {
        return new Promise((resolve, reject) => {
            this.model.count({}).exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    getHighest() {
        return new Promise((resolve, reject) => {
            this.model
                .findOne()
                .sort({ height: -1 })
                .exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    getHighestHeight() {
        return new Promise((resolve, reject) => {
            this.getHighest()
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
    removeByHeight(height) {
        return new Promise((resolve, reject) => {
            this.model.remove({ height }).exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    analyze(startHeight, endHeight) {
        return new Promise((resolve, reject) => {
            this.model
                .find({
                height: {
                    $gte: startHeight,
                    $lte: endHeight,
                },
            }, 'height apiLevel')
                .exec((err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }
    getModel(mongoose, collectionName) {
        const schema = schemas_1.blockMetaSchema;
        return mongoose.models[collectionName] || mongoose.model(collectionName, schema);
    }
}
exports.BlockMetaDao = BlockMetaDao;
//# sourceMappingURL=block-meta-dao.js.map