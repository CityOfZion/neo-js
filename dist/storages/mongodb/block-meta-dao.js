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
class BlockMetaDao {
    constructor(mongoose, collectionName) {
        this.model = this.getModel(mongoose, collectionName);
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.countDocuments({}).exec();
        });
    }
    getHighest() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model
                .findOne()
                .sort({ height: -1 })
                .exec();
        });
    }
    getHighestHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doc = yield this.getHighest();
                return doc.height;
            }
            catch (err) {
                return 0;
            }
        });
    }
    save(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model(data).save();
        });
    }
    removeByHeight(height) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.remove({ height }).exec();
        });
    }
    analyze(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model
                .find({
                height: {
                    $gte: startHeight,
                    $lte: endHeight,
                },
            }, 'height apiLevel')
                .exec();
        });
    }
    getModel(mongoose, collectionName) {
        const schema = schemas_1.blockMetaSchema;
        return mongoose.models[collectionName] || mongoose.model(collectionName, schema);
    }
}
exports.BlockMetaDao = BlockMetaDao;
//# sourceMappingURL=block-meta-dao.js.map