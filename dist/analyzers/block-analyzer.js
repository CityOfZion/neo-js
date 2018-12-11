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
    blockQueueConcurrency: 5,
    enqueueEvaluateBlockIntervalMs: 5 * 1000,
    verifyBlockMetasIntervalMs: 30 * 1000,
    maxQueueLength: 30 * 1000,
    standardEvaluateBlockPriority: 5,
    missingEvaluateBlockPriority: 3,
    loggerOptions: {},
};
class BlockAnalyzer extends events_1.EventEmitter {
    constructor(storage, options = {}) {
        super();
        this.blockMetaApiLevel = 1;
        this._isRunning = false;
        this.blockWritePointer = 0;
        this.isVerifyingBlockMetas = false;
        this.storage = storage;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.blockQueue = this.getPriorityQueue(this.options.blockQueueConcurrency);
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
        this.initBlockMetaVerification();
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
        clearInterval(this.blockMetaVerificationIntervalId);
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
                this.logger.info('Worker queued method failed, but to continue... meta:', meta, 'attrs:', attrs, 'Message:', err.message);
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
    initBlockMetaVerification() {
        this.logger.debug('initBlockMetaVerification triggered.');
        this.blockMetaVerificationIntervalId = setInterval(() => {
            this.doBlockMetaVerification();
        }, this.options.verifyBlockMetasIntervalMs);
    }
    doBlockMetaVerification() {
        this.logger.debug('doBlockMetaVerification triggered.');
        this.emit('blockMetaVerification:init');
        this.logger.info('queue.length:', this.blockQueue.length());
        if (this.isVerifyingBlockMetas) {
            this.logger.info('doBlockVerification() is already running. Skip this turn.');
            this.emit('blockMetaVerification:complete', { isSkipped: true });
            return;
        }
        this.isVerifyingBlockMetas = true;
        const startHeight = this.options.minHeight;
        const endHeight = this.options.maxHeight && this.blockWritePointer > this.options.maxHeight ? this.options.maxHeight : this.blockWritePointer;
        this.logger.debug('Analyzing block metas in storage...');
        this.storage.analyzeBlockMetas(startHeight, endHeight).then((res) => {
            this.logger.debug('Analyzing block metas complete!');
            const all = [];
            for (let i = startHeight; i <= endHeight; i++) {
                all.push(i);
            }
            const availableBlocks = lodash_1.map(res, (item) => item.height);
            this.logger.info('Blocks available count:', availableBlocks.length);
            const missingBlocks = lodash_1.difference(all, availableBlocks);
            this.logger.info('Blocks missing count:', missingBlocks.length);
            this.emit('blockMetaVerification:missingBlocks', { count: missingBlocks.length });
            missingBlocks.forEach((height) => {
                this.enqueueEvaluateBlock(height, this.options.missingEvaluateBlockPriority);
            });
            const legacyBlockObjs = lodash_1.filter(res, (item) => {
                return item.apiLevel < this.blockMetaApiLevel;
            });
            const legacyBlocks = lodash_1.map(legacyBlockObjs, (item) => item.height);
            this.logger.info('Legacy block count:', legacyBlockObjs.length);
            this.emit('blockMetaVerification:legacyBlocks', { count: legacyBlocks.length });
            legacyBlocks.forEach((height) => {
                this.storage.removeBlockMetaByHeight(height);
            });
            if (this.isReachedMaxHeight()) {
                if (missingBlocks.length === 0 && legacyBlocks.length === 0) {
                    this.logger.info('BlockAnalyzer is up to date.');
                    this.emit('upToDate');
                }
            }
            this.isVerifyingBlockMetas = false;
            this.emit('blockMetaVerification:complete', { isSuccess: true });
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
        return this.blockQueue.length() >= this.options.maxQueueLength;
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
                apiLevel: this.blockMetaApiLevel,
            };
            yield this.storage.setBlockMeta(blockMeta);
        });
    }
}
exports.BlockAnalyzer = BlockAnalyzer;
//# sourceMappingURL=block-analyzer.js.map