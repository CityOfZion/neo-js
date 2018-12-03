"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class BlockHelper {
    static getGenerationTime(block, previousBlockTimestamp) {
        return previousBlockTimestamp ? block.time - previousBlockTimestamp : 0;
    }
    static getTransactionCount(block) {
        if (block && block.tx && lodash_1.isArray(block.tx)) {
            return block.tx.length;
        }
        return 0;
    }
}
exports.BlockHelper = BlockHelper;
//# sourceMappingURL=block-helper.js.map