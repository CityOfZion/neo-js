"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class BlockHelper {
    static getGenerationTime(block, previousBlock) {
        if (previousBlock && previousBlock.time) {
            return block.time - previousBlock.time;
        }
        else {
            return 0;
        }
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