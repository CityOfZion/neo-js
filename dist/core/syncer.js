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
const MODULE_NAME = 'Syncer';
const DEFAULT_OPTIONS = {
    minHeight: 1,
    maxHeight: undefined,
    blockRedundancy: 1,
    checkRedundancyBeforeStoreBlock: true,
    startOnInit: true,
    toSyncIncremental: true,
    toSyncForMissingBlocks: true,
    toPruneRedundantBlocks: true,
    storeQueueConcurrency: 30,
    pruneQueueConcurrency: 10,
    enqueueBlockIntervalMs: 5000,
    verifyBlocksIntervalMs: 1 * 60 * 1000,
    maxStoreQueueLength: 1000,
    retryEnqueueDelayMs: 5000,
    standardEnqueueBlockPriority: 5,
    retryEnqueueBlockPriority: 3,
    missingEnqueueStoreBlockPriority: 1,
    enqueuePruneBlockPriority: 5,
    maxPruneChunkSize: 1000,
    loggerOptions: {},
};
class Syncer extends events_1.EventEmitter {
    constructor(mesh, storage, options = {}) {
        super();
        this._isRunning = false;
        this.blockWritePointer = 0;
        this.isVerifyingBlocks = false;
        this.mesh = mesh;
        this.storage = storage;
        this.options = lodash_1.merge({}, DEFAULT_OPTIONS, options);
        this.validateOptionalParameters();
        this.logger = new node_log_it_1.Logger(MODULE_NAME, this.options.loggerOptions);
        this.storeQueue = this.getPriorityQueue(this.options.storeQueueConcurrency);
        this.pruneQueue = this.getPriorityQueue(this.options.pruneQueueConcurrency);
        if (this.options.startOnInit) {
            this.start();
        }
        this.on('storeBlock:complete', this.storeBlockCompleteHandler.bind(this));
        this.logger.debug('constructor completes.');
    }
    isRunning() {
        return this._isRunning;
    }
    start() {
        if (this._isRunning) {
            this.logger.info('Syncer has already started.');
            return;
        }
        if (!this.storage) {
            this.logger.info('Unable to start syncer when no storage are defined.');
            return;
        }
        this.logger.info('Start syncer. minHeight:', this.options.minHeight, 'maxHeight:', this.options.maxHeight);
        this._isRunning = true;
        this.emit('start');
        this.initStoreBlock();
        this.initBlockVerification();
    }
    stop() {
        if (!this._isRunning) {
            this.logger.info('Syncer is not running at the moment.');
            return;
        }
        this.logger.info('Stop syncer.');
        this._isRunning = false;
        this.emit('stop');
        clearInterval(this.enqueueStoreBlockIntervalId);
        clearInterval(this.blockVerificationIntervalId);
    }
    close() {
        this.stop();
    }
    storeBlockCompleteHandler(payload) {
        if (payload.isSuccess === false) {
            this.logger.debug('storeBlockCompleteHandler !isSuccess triggered.');
            setTimeout(() => {
                this.enqueueStoreBlock(payload.height, this.options.retryEnqueueBlockPriority);
            }, this.options.retryEnqueueDelayMs);
        }
    }
    validateOptionalParameters() {
        if (!this.options.blockRedundancy) {
            throw new Error('blockRedundancy parameter must be supplied.');
        }
        else if (this.options.blockRedundancy !== 1) {
            throw new Error('supplied blockRedundancy parameter is invalid. Currently only supports for value [1].');
        }
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
    initStoreBlock() {
        this.logger.debug('initStoreBlock triggered.');
        this.setBlockWritePointer()
            .then(() => {
            if (this.options.toSyncIncremental) {
                this.enqueueStoreBlockIntervalId = setInterval(() => {
                    this.doEnqueueStoreBlock();
                }, this.options.enqueueBlockIntervalMs);
            }
        })
            .catch((err) => {
            this.logger.warn('setBlockWritePointer() failed. Error:', err.message);
        });
    }
    doEnqueueStoreBlock() {
        this.logger.debug('doEnqueueStoreBlock triggered.');
        if (this.isReachedMaxHeight()) {
            this.logger.info(`BlockWritePointer is greater or equal to designated maxHeight [${this.options.maxHeight}]. There will be no enqueue block beyond this point.`);
            return;
        }
        const node = this.mesh.getHighestNode();
        if (node) {
            while (!this.isReachedMaxHeight() && !this.isReachedHighestBlock(node) && !this.isReachedMaxStoreQueueLength()) {
                this.increaseBlockWritePointer();
                this.enqueueStoreBlock(this.blockWritePointer, this.options.standardEnqueueBlockPriority);
            }
        }
        else {
            this.logger.error('Unable to find a valid node.');
        }
    }
    isReachedMaxHeight() {
        return !!(this.options.maxHeight && this.blockWritePointer >= this.options.maxHeight);
    }
    isReachedHighestBlock(node) {
        return this.blockWritePointer >= node.blockHeight;
    }
    isReachedMaxStoreQueueLength() {
        return this.storeQueue.length() >= this.options.maxStoreQueueLength;
    }
    setBlockWritePointer() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('setBlockWritePointer triggered.');
            try {
                const height = yield this.storage.getHighestBlockHeight();
                this.logger.debug('getHighestBlockHeight() success. height:', height);
                if (this.options.minHeight && height < this.options.minHeight) {
                    this.logger.info(`storage height is smaller than designated minHeight. BlockWritePointer will be set to minHeight [${this.options.minHeight}] instead.`);
                    this.blockWritePointer = this.options.minHeight;
                }
                else {
                    this.blockWritePointer = height;
                }
            }
            catch (err) {
                this.logger.warn('storage.getHighestBlockHeight() failed. Error:', err.message);
                this.logger.info('Assumed that there are no blocks.');
                this.blockWritePointer = this.options.minHeight;
            }
        });
    }
    initBlockVerification() {
        this.logger.debug('initEnqueueBlock triggered.');
        this.blockVerificationIntervalId = setInterval(() => {
            this.doBlockVerification();
        }, this.options.verifyBlocksIntervalMs);
    }
    doBlockVerification() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('doBlockVerification triggered.');
            this.emit('blockVerification:init');
            this.logger.info('storeQueue.length:', this.storeQueue.length());
            this.logger.info('pruneQueue.length:', this.pruneQueue.length());
            if (this.isVerifyingBlocks) {
                this.logger.info('doBlockVerification() is already running. Skip this turn.');
                this.emit('blockVerification:complete', { isSkipped: true });
                return;
            }
            this.isVerifyingBlocks = true;
            const startHeight = this.options.minHeight;
            const endHeight = this.options.maxHeight && this.blockWritePointer > this.options.maxHeight ? this.options.maxHeight : this.blockWritePointer;
            this.logger.debug('Analyzing blocks in storage...');
            let blockReport;
            try {
                blockReport = yield this.storage.analyzeBlocks(startHeight, endHeight);
                this.logger.debug('Analyzing blocks complete!');
            }
            catch (err) {
                this.logger.info('storage.analyzeBlocks error, but to continue... Message:', err.message);
                this.emit('blockVerification:complete', { isSuccess: false });
                this.isVerifyingBlocks = false;
                return;
            }
            const all = [];
            for (let i = startHeight; i <= endHeight; i++) {
                all.push(i);
            }
            const availableBlocks = lodash_1.map(blockReport, (item) => item._id);
            this.logger.info('Blocks available count:', availableBlocks.length);
            const missingBlocks = lodash_1.difference(all, availableBlocks);
            this.logger.info('Blocks missing count:', missingBlocks.length);
            this.emit('blockVerification:missingBlocks', { count: missingBlocks.length });
            if (this.options.toSyncForMissingBlocks) {
                missingBlocks.forEach((height) => {
                    this.enqueueStoreBlock(height, this.options.missingEnqueueStoreBlockPriority);
                });
            }
            const excessiveBlocks = lodash_1.map(lodash_1.filter(blockReport, (item) => item.count > this.options.blockRedundancy), (item) => item._id);
            this.logger.info('Blocks excessive redundancy count:', excessiveBlocks.length);
            this.emit('blockVerification:excessiveBlocks', { count: excessiveBlocks.length });
            if (this.options.toPruneRedundantBlocks) {
                const takenBlocks = lodash_1.take(excessiveBlocks, this.options.maxPruneChunkSize);
                takenBlocks.forEach((height) => {
                    this.enqueuePruneBlock(height, this.options.blockRedundancy, this.options.enqueuePruneBlockPriority);
                });
            }
            if (this.options.blockRedundancy > 1) {
                const insufficientBlocks = lodash_1.map(lodash_1.filter(blockReport, (item) => item.count < this.options.blockRedundancy), (item) => item._id);
                this.logger.info('Blocks insufficient redundancy count:', insufficientBlocks.length);
                throw new Error('Not Implemented.');
            }
            const node = this.mesh.getHighestNode();
            if (node) {
                if (this.isReachedMaxHeight() || this.isReachedHighestBlock(node)) {
                    if (missingBlocks.length === 0) {
                        this.logger.info('Storage is fully synced and up to date.');
                        this.emit('upToDate');
                    }
                }
            }
            this.isVerifyingBlocks = false;
            this.emit('blockVerification:complete', { isSuccess: true });
        });
    }
    increaseBlockWritePointer() {
        this.logger.debug('increaseBlockWritePointer triggered.');
        this.blockWritePointer += 1;
    }
    enqueueStoreBlock(height, priority) {
        this.logger.debug('enqueueStoreBlock triggered. height:', height, 'priority:', priority);
        if (height > this.blockWritePointer) {
            this.logger.debug('height > this.blockWritePointer, blockWritePointer is now:', height);
            this.blockWritePointer = height;
        }
        this.storeQueue.push({
            method: this.storeBlock.bind(this),
            attrs: {
                height,
            },
            meta: {
                methodName: 'storeBlock',
            },
        }, priority);
    }
    enqueuePruneBlock(height, redundancySize, priority) {
        this.logger.debug('enqueuePruneBlock triggered. height:', height, 'redundancySize:', redundancySize, 'priority:', priority);
        this.pruneQueue.push({
            method: this.pruneBlock.bind(this),
            attrs: {
                height,
                redundancySize,
            },
            meta: {
                methodName: 'pruneBlock',
            },
        }, priority);
    }
    storeBlock(attrs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('storeBlock triggered. attrs:', attrs);
            const height = attrs.height;
            const node = this.mesh.getOptimalNode(height);
            this.emit('storeBlock:init', { height });
            try {
                if (this.options.checkRedundancyBeforeStoreBlock) {
                    const redundantCount = yield this.storage.countBlockRedundancy(height);
                    if (redundantCount >= this.options.blockRedundancy) {
                        this.logger.debug('setBlock skipped. height:', height);
                        this.emit('storeBlock:complete', { isSkipped: true, height });
                        return;
                    }
                }
                if (!node) {
                    this.emit('storeBlock:complete', { isSuccess: false, height });
                    throw new Error('No valid node found.');
                }
                const block = yield node.getBlock(height);
                const source = node.endpoint;
                const userAgent = node.userAgent;
                yield this.storage.setBlock(height, block, { source, userAgent });
                this.logger.debug('storeBlock succeeded. height:', height);
                this.emit('storeBlock:complete', { isSuccess: true, height });
            }
            catch (err) {
                this.logger.debug('storeBlock failed. height:', height, 'Message:', err.message);
                this.emit('storeBlock:complete', { isSuccess: false, height });
                throw err;
            }
        });
    }
    pruneBlock(attrs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('pruneBlock triggered. attrs:', attrs);
            const height = attrs.height;
            const redundancySize = attrs.redundancySize;
            yield this.storage.pruneBlock(height, redundancySize);
        });
    }
}
exports.Syncer = Syncer;
//# sourceMappingURL=syncer.js.map