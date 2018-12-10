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
const neon_js_1 = require("@cityofzion/neon-js");
const rpc_validator_1 = require("../validators/rpc-validator");
class RpcDelegate {
    static query(url, method, params, id, requestConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            rpc_validator_1.RpcValidator.validateUrl(url);
            rpc_validator_1.RpcValidator.validateMethod(method);
            rpc_validator_1.RpcValidator.validateId(id);
            const q = new neon_js_1.rpc.Query({ method, params, id });
            return yield q.execute(url, requestConfig);
        });
    }
}
exports.RpcDelegate = RpcDelegate;
//# sourceMappingURL=rpc-delegate.js.map