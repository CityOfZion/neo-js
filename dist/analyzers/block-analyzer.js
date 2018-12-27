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
const events_1 = require("events");
const async_1 = require("async");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const block_helper_1 = require("../helpers/block-helper");
const MODULE_NAME = 'BlockAnalyzer';
const DEFAULT_OPTIONS = {
    minHeight: 1,
    maxHeight: undefined,
    startOnInit: true,
    toEvaluateTransactions: true,
    toEvaluateAssets: false,
    blockQueueConcurrency: 5,
    transactionQueueConcurrency: 10,
    enqueueEvaluateBlockIntervalMs: 5 * 1000,
    verifyBlocksIntervalMs: 30 * 1000,
    maxBlockQueueLength: 30 * 1000,
    maxTransactionQueueLength: 100 * 1000,
    standardEvaluateBlockPriority: 5,
    missingEvaluateBlockPriority: 3,
    legacyEvaluateBlockPriority: 3,
    standardEvaluateTransactionPriority: 5,
    missingEvaluateTransactionPriority: 5,
    legacyEvaluateTransactionPriority: 5,
    loggerOptions: {},
};
class BlockAnalyzer extends events_1.EventEmitter {
    constructor(storage, options = {}) {
        super();
        this.BLOCK_META_API_LEVEL = 1;
        this.TRANSACTION_META_API_LEVEL = 1;
        this._isRunning = false;
        this.blockWritePointer = 0;
        this.isVerifyingBlocks = false;
        this.storage = storage;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.blockQueue = this.getPriorityQueue(this.options.blockQueueConcurrency);
        this.transactionQueue = this.getPriorityQueue(this.options.transactionQueueConcurrency);
        if (this.options.startOnInit) {
            this.start();
        }
        this.logger.debug('constructor completes.');
    }
    isRunning() {
        return this._isRunning;
    }
    start() {
        if (this._isRunning) {
            this.logger.info('BlockAnalyzer has already started.');
            return;
        }
        if (!this.storage) {
            this.logger.info('Unable to start BlockAnalyzer when no storage are defined.');
            return;
        }
        this.logger.info('Start BlockAnalyzer.');
        this._isRunning = true;
        this.emit('start');
        this.initEvaluateBlock();
        this.initBlockVerification();
    }
    stop() {
        if (!this._isRunning) {
            this.logger.info('BlockAnalyzer is not running at the moment.');
            return;
        }
        this.logger.info('Stop BlockAnalyzer.');
        this._isRunning = false;
        this.emit('stop');
        clearInterval(this.enqueueEvaluateBlockIntervalId);
        clearInterval(this.blockVerificationIntervalId);
    }
    close() {
        this.stop();
    }
    validateOptionalParameters() {
    }
    getPriorityQueue(concurrency) {
        return async_1.priorityQueue((task, callback) => {
            const method = task.method;
            const attrs = task.attrs;
            const meta = task.meta;
            this.logger.debug('New worker for queue. meta:', meta, 'attrs:', attrs);
            method(attrs)
                .then(() => {
                callback();
                this.logger.debug('Worker queued method completed.');
                this.emit('queue:worker:complete', { isSuccess: true, task });
            })
                .catch((err) => {
                this.logger.info('Worker queued method failed, but to continue... meta:', meta, 'Message:', err.message);
                callback();
                this.emit('queue:worker:complete', { isSuccess: false, task });
            });
        }, concurrency);
    }
    initEvaluateBlock() {
        this.logger.debug('initEvaluateBlock triggered.');
        this.setBlockWritePointer()
            .then(() => {
            this.enqueueEvaluateBlockIntervalId = setInterval(() => {
                this.doEnqueueEvaluateBlock();
            }, this.options.enqueueEvaluateBlockIntervalMs);
        })
            .catch((err) => {
            this.logger.warn('setBlockWritePointer() failed. Error:', err.message);
        });
    }
    setBlockWritePointer() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('setBlockWritePointer triggered.');
            try {
                const height = yield this.storage.getHighestBlockMetaHeight();
                this.logger.debug('getBlockMetaCount success. height:', height);
                if (this.options.minHeight && height < this.options.minHeight) {
                    this.logger.info(`storage height is smaller than designated minHeight. BlockWritePointer will be set to minHeight [${this.options.minHeight}] instead.`);
                    this.blockWritePointer = this.options.minHeight;
                }
                else {
                    this.blockWritePointer = height;
                }
            }
            catch (err) {
                this.logger.warn('storage.getBlockMetaCount() failed. Error:', err.message);
                this.logger.info('Assumed that there are no blocks.');
                this.blockWritePointer = this.options.minHeight;
            }
        });
    }
    initBlockVerification() {
        this.logger.debug('initBlockVerification triggered.');
        this.blockVerificationIntervalId = setInterval(() => {
            this.doBlockVerification();
        }, this.options.verifyBlocksIntervalMs);
    }
    doBlockVerification() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('doBlockVerification triggered.');
            this.emit('blockVerification:init');
            this.logger.info('blockQueue.length:', this.blockQueue.length());
            this.logger.info('transactionQueue.length:', this.transactionQueue.length());
            if (this.isVerifyingBlocks) {
                this.logger.info('doBlockVerification() is already running. Skip this turn.');
                this.emit('blockVerification:complete', { isSkipped: true });
                return;
            }
            this.isVerifyingBlocks = true;
            const startHeight = this.options.minHeight;
            const endHeight = this.options.maxHeight && this.blockWritePointer > this.options.maxHeight ? this.options.maxHeight : this.blockWritePointer;
            let blockMetasFullySynced = false;
            let transactionMetasFullySynced = false;
            try {
                blockMetasFullySynced = yield this.verifyBlockMetas(startHeight, endHeight);
                transactionMetasFullySynced = yield this.verifyTransactionMetas(startHeight, endHeight);
            }
            catch (err) {
                this.logger.info('Block verification failed. Message:', err.message);
                this.isVerifyingBlocks = false;
                this.emit('blockVerification:complete', { isSuccess: false });
                return;
            }
            if (this.isReachedMaxHeight()) {
                if (blockMetasFullySynced && transactionMetasFullySynced) {
                    this.logger.info('BlockAnalyzer is up to date.');
                    this.emit('upToDate');
                }
            }
            this.isVerifyingBlocks = false;
            this.emit('blockVerification:complete', { isSuccess: true });
        });
    }
    verifyBlockMetas(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('verifyBlockMetas triggered.');
            const blockMetaReport = yield this.storage.analyzeBlockMetas(startHeight, endHeight);
            this.logger.debug('Analyzing block metas complete!');
            const all = this.getNumberArray(startHeight, endHeight);
            const availableBlocks = lodash_1.map(blockMetaReport, (item) => item.height);
            this.logger.info('Block metas available count:', availableBlocks.length);
            const missingBlocks = lodash_1.difference(all, availableBlocks);
            this.logger.info('Block metas missing count:', missingBlocks.length);
            this.emit('blockVerification:missingBlockMetas', { count: missingBlocks.length });
            missingBlocks.forEach((height) => {
                this.enqueueEvaluateBlock(height, this.options.missingEvaluateBlockPriority);
            });
            const legacyBlockObjs = lodash_1.filter(blockMetaReport, (item) => {
                return item.apiLevel < this.BLOCK_META_API_LEVEL;
            });
            const legacyBlocks = lodash_1.map(legacyBlockObjs, (item) => item.height);
            this.logger.info('Legacy block metas count:', legacyBlockObjs.length);
            this.emit('blockVerification:legacyBlockMetas', { count: legacyBlocks.length });
            legacyBlocks.forEach((height) => {
                this.storage.removeBlockMetaByHeight(height);
                this.enqueueEvaluateBlock(height, this.options.legacyEvaluateBlockPriority);
            });
            const fullySynced = missingBlocks.length === 0 && legacyBlocks.length === 0;
            return fullySynced;
        });
    }
    verifyTransactionMetas(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('verifyTransactionMetas triggered.');
            const transactionMetaReport = yield this.storage.analyzeTransactionMetas(startHeight, endHeight);
            this.logger.debug('Analyzing block metas complete!');
            const all = this.getNumberArray(startHeight, endHeight);
            const availableBlocks = lodash_1.uniq(lodash_1.map(transactionMetaReport, (item) => item.height));
            this.logger.info('Block available count (in TransactionMeta):', availableBlocks.length);
            const missingBlocks = lodash_1.difference(all, availableBlocks);
            this.logger.info('Blocks missing count (in TransactionMeta):', missingBlocks.length);
            this.emit('blockVerification:transactionMetas:missing', { blockCount: missingBlocks.length });
            missingBlocks.forEach((height) => {
                this.enqueueEvaluateTransactionWithHeight(height, this.options.missingEvaluateTransactionPriority);
            });
            const legacyTransactionObjs = lodash_1.filter(transactionMetaReport, (item) => {
                return item.apiLevel < this.TRANSACTION_META_API_LEVEL;
            });
            const legacyBlocks = lodash_1.uniq(lodash_1.map(legacyTransactionObjs, (item) => item.height));
            this.logger.info('Legacy block count (in TransactionMeta):', legacyTransactionObjs.length);
            this.emit('blockVerification:transactionMetas:legacy', { blockCount: legacyBlocks.length });
            yield this.storage.pruneLegacyTransactionMeta(this.TRANSACTION_META_API_LEVEL);
            legacyBlocks.forEach((height) => {
                this.enqueueEvaluateTransactionWithHeight(height, this.options.legacyEvaluateTransactionPriority);
            });
            const fullySynced = missingBlocks.length === 0 && legacyBlocks.length === 0;
            return fullySynced;
        });
    }
    doEnqueueEvaluateBlock() {
        this.logger.debug('doEnqueueEvaluateBlock triggered.');
        if (this.isReachedMaxHeight()) {
            this.logger.info(`BlockWritePointer is greater or equal to designated maxHeight [${this.options.maxHeight}]. There will be no enqueue block beyond this point.`);
            return;
        }
        while (!this.isReachedMaxHeight() && !this.isReachedMaxQueueLength()) {
            this.increaseBlockWritePointer();
            this.enqueueEvaluateBlock(this.blockWritePointer, this.options.standardEvaluateBlockPriority);
        }
    }
    isReachedMaxHeight() {
        return !!(this.options.maxHeight && this.blockWritePointer >= this.options.maxHeight);
    }
    isReachedMaxQueueLength() {
        return this.blockQueue.length() >= this.options.maxBlockQueueLength;
    }
    increaseBlockWritePointer() {
        this.logger.debug('increaseBlockWritePointer triggered.');
        this.blockWritePointer += 1;
    }
    enqueueEvaluateBlock(height, priority) {
        this.logger.debug('enqueueEvaluateBlock triggered. height:', height, 'priority:', priority);
        if (height > this.blockWritePointer) {
            this.logger.debug('height > this.blockWritePointer, blockWritePointer is now:', height);
            this.blockWritePointer = height;
        }
        this.blockQueue.push({
            method: this.evaluateBlock.bind(this),
            attrs: {
                height,
            },
            meta: {
                methodName: 'evaluateBlock',
            },
        }, priority);
    }
    evaluateBlock(attrs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('evaluateBlock triggered. attrs:', attrs);
            const height = attrs.height;
            let previousBlock;
            if (height > 1) {
                previousBlock = yield this.storage.getBlock(height - 1);
            }
            const block = yield this.storage.getBlock(height);
            const blockMeta = {
                height,
                time: block.time,
                size: block.size,
                generationTime: block_helper_1.BlockHelper.getGenerationTime(block, previousBlock),
                transactionCount: block_helper_1.BlockHelper.getTransactionCount(block),
                apiLevel: this.BLOCK_META_API_LEVEL,
            };
            if (this.options.toEvaluateTransactions) {
                this.enqueueEvaluateTransaction(block, this.options.standardEvaluateTransactionPriority);
            }
            yield this.storage.setBlockMeta(blockMeta);
        });
    }
    enqueueEvaluateTransaction(block, priority) {
        this.logger.debug('enqueueEvaluateTransaction triggered.');
        if (!block || !block.tx) {
            this.logger.info('Invalid block object. Skipping...');
            return;
        }
        block.tx.forEach((transaction) => {
            this.transactionQueue.push({
                method: this.evaluateTransaction.bind(this),
                attrs: {
                    height: block.index,
                    time: block.time,
                    transaction,
                },
                meta: {
                    methodName: 'evaluateTransaction',
                },
            }, priority);
        });
    }
    enqueueEvaluateTransactionWithHeight(height, priority) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('enqueueEvaluateTransactionWithHeight triggered.');
            const block = yield this.storage.getBlock(height);
            this.enqueueEvaluateTransaction(block, priority);
        });
    }
    evaluateTransaction(attrs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('evaluateTransaction triggered.');
            const height = attrs.height;
            const time = attrs.time;
            const tx = attrs.transaction;
            const voutCount = lodash_1.isArray(tx.vout) ? tx.vout.length : undefined;
            const vinCount = lodash_1.isArray(tx.vin) ? tx.vin.length : undefined;
            const transactionMeta = {
                height,
                time,
                transactionId: tx.txid,
                type: tx.type,
                size: tx.size,
                networkFee: tx.net_fee,
                systemFee: tx.sys_fee,
                voutCount,
                vinCount,
                apiLevel: this.TRANSACTION_META_API_LEVEL,
            };
            yield this.storage.setTransactionMeta(transactionMeta);
        });
    }
    getNumberArray(start, end) {
        const all = [];
        for (let i = start; i <= end; i++) {
            all.push(i);
        }
        return all;
    }
}
exports.BlockAnalyzer = BlockAnalyzer;
//# sourceMappingURL=block-analyzer.js.map