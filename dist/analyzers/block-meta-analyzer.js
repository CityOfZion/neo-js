"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const async_1 = require("async");
const node_log_it_1 = require("node-log-it");
const lodash_1 = require("lodash");
const block_helper_1 = require("../helpers/block-helper");
const MODULE_NAME = 'BlockMetaAnalyzer';
const DEFAULT_OPTIONS = {
    minHeight: 1,
    maxHeight: undefined,
    startOnInit: true,
    analyzeQueueConcurrency: 5,
    enqueueBlockIntervalMs: 5 * 1000,
    verifyBlockMetasIntervalMs: 30 * 1000,
    maxQueueLength: 30 * 1000,
    standardEnqueueBlockPriority: 5,
    missingEnqueueBlockPriority: 3,
    loggerOptions: {},
};
class BlockMetaAnalyzer extends events_1.EventEmitter {
    constructor(storage, options = {}) {
        super();
        this.apiLevel = 1;
        this._isRunning = false;
        this.blockWritePointer = 0;
        this.isVerifyingBlockMetas = false;
        this.storage = storage;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.queue = this.getPriorityQueue(this.options.analyzeQueueConcurrency);
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
            this.logger.info('BlockMetaAnalyzer has already started.');
            return;
        }
        if (!this.storage) {
            this.logger.info('Unable to start BlockMetaAnalyzer when no storage are defined.');
            return;
        }
        this.logger.info('Start BlockMetaAnalyzer.');
        this._isRunning = true;
        this.emit('start');
        this.initAnalyzeBlock();
        this.initBlockMetaVerification();
    }
    stop() {
        if (!this._isRunning) {
            this.logger.info('BlockMetaAnalyzer is not running at the moment.');
            return;
        }
        this.logger.info('Stop BlockMetaAnalyzer.');
        this._isRunning = false;
        this.emit('stop');
        clearInterval(this.enqueueAnalyzeBlockIntervalId);
        clearInterval(this.blockMetaVerificationIntervalId);
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
    initAnalyzeBlock() {
        this.logger.debug('initAnalyzeBlock triggered.');
        this.setBlockWritePointer()
            .then(() => {
            this.enqueueAnalyzeBlockIntervalId = setInterval(() => {
                this.doEnqueueAnalyzeBlock();
            }, this.options.enqueueBlockIntervalMs);
        })
            .catch((err) => {
            this.logger.warn('storage.getBlockCount() failed. Error:', err.message);
        });
    }
    setBlockWritePointer() {
        this.logger.debug('setBlockWritePointer triggered.');
        return new Promise((resolve, reject) => {
            this.storage.getHighestBlockMetaHeight()
                .then((height) => {
                this.logger.debug('getBlockMetaCount success. height:', height);
                if (this.options.minHeight && height < this.options.minHeight) {
                    this.logger.info(`storage height is smaller than designated minHeight. BlockWritePointer will be set to minHeight [${this.options.minHeight}] instead.`);
                    this.blockWritePointer = this.options.minHeight;
                }
                else {
                    this.blockWritePointer = height;
                }
                resolve();
            })
                .catch((err) => {
                this.logger.warn('storage.getBlockMetaCount() failed. Error:', err.message);
                this.logger.info('Assumed that there are no blocks.');
                this.blockWritePointer = this.options.minHeight;
                resolve();
            });
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
        this.logger.info('queue.length:', this.queue.length());
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
                this.enqueueAnalyzeBlock(height, this.options.missingEnqueueBlockPriority);
            });
            const legacyBlockObjs = lodash_1.filter(res, (item) => {
                return item.apiLevel < this.apiLevel;
            });
            const legacyBlocks = lodash_1.map(legacyBlockObjs, (item) => item.height);
            this.logger.info('Legacy block count:', legacyBlockObjs.length);
            this.emit('blockMetaVerification:legacyBlocks', { count: legacyBlocks.length });
            legacyBlocks.forEach((height) => {
                this.storage.removeBlockMetaByHeight(height);
            });
            if (this.isReachedMaxHeight()) {
                if (missingBlocks.length === 0 && legacyBlocks.length === 0) {
                    this.logger.info('BlockMetaAnalyzer is up to date.');
                    this.emit('upToDate');
                }
            }
            this.isVerifyingBlockMetas = false;
            this.emit('blockMetaVerification:complete', { isSuccess: true });
        });
    }
    doEnqueueAnalyzeBlock() {
        this.logger.debug('doEnqueueAnalyzeBlock triggered.');
        if (this.isReachedMaxHeight()) {
            this.logger.info(`BlockWritePointer is greater or equal to designated maxHeight [${this.options.maxHeight}]. There will be no enqueue block beyond this point.`);
            return;
        }
        while (!this.isReachedMaxHeight() && !this.isReachedMaxQueueLength()) {
            this.increaseBlockWritePointer();
            this.enqueueAnalyzeBlock(this.blockWritePointer, this.options.standardEnqueueBlockPriority);
        }
    }
    isReachedMaxHeight() {
        return !!(this.options.maxHeight && this.blockWritePointer >= this.options.maxHeight);
    }
    isReachedMaxQueueLength() {
        return this.queue.length() >= this.options.maxQueueLength;
    }
    increaseBlockWritePointer() {
        this.logger.debug('increaseBlockWritePointer triggered.');
        this.blockWritePointer += 1;
    }
    enqueueAnalyzeBlock(height, priority) {
        this.logger.debug('enqueueAnalyzeBlock triggered. height:', height, 'priority:', priority);
        if (height > this.blockWritePointer) {
            this.logger.debug('height > this.blockWritePointer, blockWritePointer is now:', height);
            this.blockWritePointer = height;
        }
        this.queue.push({
            method: this.analyzeBlock.bind(this),
            attrs: {
                height,
            },
            meta: {
                methodName: 'analyzeBlock',
            },
        }, priority);
    }
    analyzeBlock(attrs) {
        this.logger.debug('analyzeBlock triggered. attrs:', attrs);
        const height = attrs.height;
        let previousBlockTimestamp;
        return new Promise((resolve, reject) => {
            Promise.resolve()
                .then(() => {
                if (height === 1) {
                    return Promise.resolve();
                }
                else {
                    return this.storage.getBlock(height - 1);
                }
            })
                .then((previousBlock) => {
                if (previousBlock) {
                    previousBlockTimestamp = previousBlock.time;
                }
                return Promise.resolve();
            })
                .then(() => this.storage.getBlock(height))
                .then((block) => {
                const blockMeta = {
                    height,
                    time: block.time,
                    size: block.size,
                    generationTime: block_helper_1.BlockHelper.getGenerationTime(block, previousBlockTimestamp),
                    transactionCount: block_helper_1.BlockHelper.getTransactionCount(block),
                    apiLevel: this.apiLevel,
                };
                return Promise.resolve(blockMeta);
            })
                .then((blockMeta) => this.storage.setBlockMeta(blockMeta))
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }
}
exports.BlockMetaAnalyzer = BlockMetaAnalyzer;
//# sourceMappingURL=block-meta-analyzer.js.map