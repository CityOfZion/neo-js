"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const neon_js_1 = require("@cityofzion/neon-js");
const rpc_validator_1 = require("../validators/rpc-validator");
class RpcDelegate {
    static query(url, method, params, id, requestConfig) {
        rpc_validator_1.RpcValidator.validateUrl(url);
        rpc_validator_1.RpcValidator.validateMethod(method);
        rpc_validator_1.RpcValidator.validateId(id);
        const q = new neon_js_1.rpc.Query({ method, params, id });
        return q.execute(url, requestConfig);
    }
}
exports.RpcDelegate = RpcDelegate;
//# sourceMappingURL=rpc-delegate.js.map