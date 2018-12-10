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
const schemas_1 = require("./schemas");
const utils_1 = require("./utils");
class BlockDao {
    constructor(mongoose, collectionName) {
        this.model = this.getModel(mongoose, collectionName);
    }
    countByHeight(height) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.countDocuments({ height }).exec();
        });
    }
    getHighestHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model
                .findOne({}, 'height')
                .sort({ height: -1 })
                .exec();
            return doc.height;
        });
    }
    getByHeight(height) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model
                .findOne({ height })
                .sort({ createdAt: -1 })
                .exec();
        });
    }
    listByHeight(height) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.model
                .find({ height })
                .sort({ createdAt: -1 })
                .exec();
            if (!result) {
                return [];
            }
            return result;
        });
    }
    getByTransactionId(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model
                .findOne({
                'payload.tx': {
                    $elemMatch: {
                        txid: transactionId,
                    },
                },
            })
                .exec();
        });
    }
    save(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.model(data).save();
        });
    }
    removeById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.model.remove({ _id: id }).exec();
        });
    }
    analyze(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
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
            return yield this.model
                .aggregate(aggregatorOptions)
                .allowDiskUse(true)
                .exec();
        });
    }
    reviewIndex(key, keyObj) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield utils_1.MongodbUtils.reviewIndex(this.model, key, keyObj);
        });
    }
    getModel(mongoose, collectionName) {
        const schema = schemas_1.blockSchema;
        return mongoose.models[collectionName] || mongoose.model(collectionName, schema);
    }
}
exports.BlockDao = BlockDao;
//# sourceMappingURL=block-dao.js.map