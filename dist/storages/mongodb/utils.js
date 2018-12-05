"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class MongodbUtils {
    static reviewIndex(model, key, keyObj) {
        return new Promise((resolve, reject) => {
            Promise.resolve()
                .then(() => MongodbUtils.hasIndex(model, key))
                .then((hasRequiredIndex) => {
                if (hasRequiredIndex) {
                    throw new Error('SKIP_INDEX');
                }
                return Promise.resolve();
            })
                .then(() => MongodbUtils.createIndex(model, keyObj))
                .then(() => {
                return resolve();
            })
                .catch((err) => {
                if (err.message === 'SKIP_INDEX') {
                    return resolve();
                }
                else {
                    return reject(err);
                }
            });
        });
    }
    static hasIndex(model, key) {
        return new Promise((resolve, reject) => {
            model.collection
                .getIndexes()
                .then((res) => {
                const keys = Object.keys(res);
                const result = lodash_1.includes(keys, key);
                return resolve(result);
            })
                .catch((err) => reject(err));
        });
    }
    static createIndex(model, keyObj) {
        return new Promise((resolve, reject) => {
            model.collection
                .createIndex(keyObj)
                .then((res) => resolve())
                .catch((err) => reject(err));
        });
    }
}
exports.MongodbUtils = MongodbUtils;
//# sourceMappingURL=utils.js.map