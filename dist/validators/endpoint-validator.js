"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EndpointValidator {
    static validateArray(endpoints) {
        if (endpoints.length <= 0) {
            throw new Error(`'endpoints' must be an non empty array.`);
        }
        endpoints.forEach((ep) => {
            if (!ep.endpoint) {
                throw new Error(`item of 'endpoints' contain 'endpoint' property.`);
            }
        });
    }
}
exports.EndpointValidator = EndpointValidator;
//# sourceMappingURL=endpoint-validator.js.map