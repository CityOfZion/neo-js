"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.blockSchema = new mongoose_1.Schema({
    height: Number,
    createdBy: String,
    source: String,
    userAgent: String,
    payload: {
        hash: String,
        size: Number,
        version: Number,
        previousblockhash: String,
        merkleroot: String,
        time: Number,
        index: { type: 'Number', required: true },
        nonce: String,
        nextconsensus: String,
        script: {
            invocation: String,
            verification: String,
        },
        tx: [],
        confirmations: Number,
        nextblockhash: String,
    },
}, { timestamps: true });
exports.blockMetaSchema = new mongoose_1.Schema({
    height: { type: 'Number', unique: true, required: true, dropDups: true },
    time: Number,
    size: Number,
    generationTime: Number,
    transactionCount: Number,
    createdBy: String,
    apiLevel: Number,
}, { timestamps: true });
exports.transactionMetaSchema = new mongoose_1.Schema({
    height: Number,
    time: Number,
    transactionId: { type: 'String', unique: true, required: true, dropDups: true },
    type: String,
    size: Number,
    networkFee: Number,
    systemFee: Number,
    voutCount: Number,
    vinCount: Number,
    createdBy: String,
    apiLevel: Number,
}, { timestamps: true });
//# sourceMappingURL=schemas.js.map