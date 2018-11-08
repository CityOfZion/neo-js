"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NeoValidator {
    static validateHeight(height) {
        if (height <= 0) {
            throw new Error(`'height' must be an integer 1 or above.`);
        }
    }
}
exports.NeoValidator = NeoValidator;
//# sourceMappingURL=neo-validator.js.map