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
const lodash_1 = require("lodash");
class MongodbUtils {
    static reviewIndex(model, key, keyObj) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasRequiredIndex = yield MongodbUtils.hasIndex(model, key);
            if (hasRequiredIndex) {
                return;
            }
            yield MongodbUtils.createIndex(model, keyObj);
        });
    }
    static hasIndex(model, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexes = yield model.collection.getIndexes();
            const keys = Object.keys(indexes);
            const canFindIndex = lodash_1.includes(keys, key);
            return canFindIndex;
        });
    }
    static createIndex(model, keyObj) {
        return __awaiter(this, void 0, void 0, function* () {
            yield model.collection.createIndex(keyObj);
        });
    }
}
exports.MongodbUtils = MongodbUtils;
//# sourceMappingURL=utils.js.map