import { EventEmitter } from 'events'
import { priorityQueue, AsyncPriorityQueue } from 'async'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge, map, filter, difference } from 'lodash'
import { MemoryStorage } from '../storages/memory-storage'
import { MongodbStorage } from '../storages/mongodb-storage'
import { BlockHelper } from '../helpers/block-helper'

const MODULE_NAME = 'BlockAnalyzer'
const DEFAULT_OPTIONS: BlockAnalyzerOptions = {
  minHeight: 1,
  maxHeight: undefined,
  startOnInit: true,
  toEvaluateTransactions: true,
  toEvaluateAssets: false,
  blockQueueConcurrency: 5,
  transactionQueueConcurrency: 10,
  enqueueEvaluateBlockIntervalMs: 5 * 1000,
  verifyBlockMetasIntervalMs: 30 * 1000,
  maxBlockQueueLength: 30 * 1000,
  maxTransactionQueueLength: 100 * 1000,
  standardEvaluateBlockPriority: 5,
  missingEvaluateBlockPriority: 3,
  standardEvaluateTransactionPriority: 5,
  loggerOptions: {},
}

export interface BlockAnalyzerOptions {
  minHeight?: number
  maxHeight?: number
  startOnInit?: boolean
  toEvaluateTransactions?: boolean
  toEvaluateAssets?: boolean
  blockQueueConcurrency?: number
  transactionQueueConcurrency?: number
  enqueueEvaluateBlockIntervalMs?: number
  verifyBlockMetasIntervalMs?: number
  maxBlockQueueLength?: number
  maxTransactionQueueLength?: number
  standardEvaluateBlockPriority?: number
  missingEvaluateBlockPriority?: number
  standardEvaluateTransactionPriority?: number
  loggerOptions?: LoggerOptions
}

export class BlockAnalyzer extends EventEmitter {
  /**
   * Flags for determine version of the metadata (akin to Android API level)
   */
  private BLOCK_META_API_LEVEL = 1
  private TRANSACTION_META_API_LEVEL = 1
  private _isRunning = false
  private blockQueue: AsyncPriorityQueue<object>
  private transactionQueue: AsyncPriorityQueue<object>
  private blockWritePointer: number = 0
  private storage?: MemoryStorage | MongodbStorage
  private options: BlockAnalyzerOptions
  private logger: Logger
  private enqueueEvaluateBlockIntervalId?: NodeJS.Timer
  private blockMetaVerificationIntervalId?: NodeJS.Timer
  private isVerifyingBlockMetas = false

  constructor(storage?: MemoryStorage | MongodbStorage, options: BlockAnalyzerOptions = {}) {
    super()

    // Associate required properties
    this.storage = storage

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.blockQueue = this.getPriorityQueue(this.options.blockQueueConcurrency!)
    this.transactionQueue = this.getPriorityQueue(this.options.transactionQueueConcurrency!)
    if (this.options.startOnInit) {
      this.start()
    }

    this.logger.debug('constructor completes.')
  }

  isRunning(): boolean {
    return this._isRunning
  }

  start() {
    if (this._isRunning) {
      this.logger.info('BlockAnalyzer has already started.')
      return
    }

    if (!this.storage) {
      this.logger.info('Unable to start BlockAnalyzer when no storage are defined.')
      return
    }

    this.logger.info('Start BlockAnalyzer.')
    this._isRunning = true
    this.emit('start')

    this.initEvaluateBlock()
    this.initBlockMetaVerification()
  }

  stop() {
    if (!this._isRunning) {
      this.logger.info('BlockAnalyzer is not running at the moment.')
      return
    }

    this.logger.info('Stop BlockAnalyzer.')
    this._isRunning = false
    this.emit('stop')

    clearInterval(this.enqueueEvaluateBlockIntervalId!)
    clearInterval(this.blockMetaVerificationIntervalId!)
  }

  close() {
    this.stop()
  }

  private validateOptionalParameters() {
    // TODO
  }

  private getPriorityQueue(concurrency: number): AsyncPriorityQueue<object> {
    return priorityQueue((task: object, callback: () => void) => {
      const method: (attrs: object) => Promise<any> = (task as any).method
      const attrs: object = (task as any).attrs
      const meta: object = (task as any).meta
      this.logger.debug('New worker for queue. meta:', meta, 'attrs:', attrs)

      method(attrs)
        .then(() => {
          callback()
          this.logger.debug('Worker queued method completed.')
          this.emit('queue:worker:complete', { isSuccess: true, task })
        })
        .catch((err: any) => {
          this.logger.info('Worker queued method failed, but to continue... meta:', meta, 'attrs:', attrs, 'Message:', err.message)
          callback()
          this.emit('queue:worker:complete', { isSuccess: false, task })
        })
    }, concurrency)
  }

  private initEvaluateBlock() {
    this.logger.debug('initEvaluateBlock triggered.')
    this.setBlockWritePointer()
      .then(() => {
        // Enqueue blocks for evaluation
        this.enqueueEvaluateBlockIntervalId = setInterval(() => {
          this.doEnqueueEvaluateBlock()
        }, this.options.enqueueEvaluateBlockIntervalMs!)
      })
      .catch((err: any) => {
        this.logger.warn('setBlockWritePointer() failed. Error:', err.message)
      })
  }

  private async setBlockWritePointer(): Promise<void> {
    this.logger.debug('setBlockWritePointer triggered.')

    try {
      const height = await this.storage!.getHighestBlockMetaHeight()
      this.logger.debug('getBlockMetaCount success. height:', height)
      if (this.options.minHeight && height < this.options.minHeight) {
        this.logger.info(`storage height is smaller than designated minHeight. BlockWritePointer will be set to minHeight [${this.options.minHeight}] instead.`)
        this.blockWritePointer = this.options.minHeight
      } else {
        this.blockWritePointer = height
      }
    } catch (err) {
      this.logger.warn('storage.getBlockMetaCount() failed. Error:', err.message)
      this.logger.info('Assumed that there are no blocks.')
      this.blockWritePointer = this.options.minHeight!
      // Suppress error and continue
    }
  }

  private initBlockMetaVerification() {
    this.logger.debug('initBlockMetaVerification triggered.')
    this.blockMetaVerificationIntervalId = setInterval(() => {
      this.doBlockMetaVerification()
    }, this.options.verifyBlockMetasIntervalMs!)
  }

  private doBlockMetaVerification() {
    this.logger.debug('doBlockMetaVerification triggered.')
    this.emit('blockMetaVerification:init')

    // Queue sizes
    this.logger.info('queue.length:', this.blockQueue.length())

    // Check if this process is currently executing
    if (this.isVerifyingBlockMetas) {
      this.logger.info('doBlockVerification() is already running. Skip this turn.')
      this.emit('blockMetaVerification:complete', { isSkipped: true })
      return
    }

    // Blocks analysis
    this.isVerifyingBlockMetas = true
    const startHeight = this.options.minHeight!
    const endHeight = this.options.maxHeight && this.blockWritePointer > this.options.maxHeight ? this.options.maxHeight : this.blockWritePointer
    this.logger.debug('Analyzing block metas in storage...')
    // TODO: also fetch and evaluate docs' apiLevel
    this.storage!.analyzeBlockMetas(startHeight, endHeight).then((res: any) => {
      this.logger.debug('Analyzing block metas complete!')
      // this.logger.warn('analyzeBlockMetas res:', res)
      // this.logger.warn('this.apiLevel:', this.apiLevel)

      const all: number[] = []
      for (let i = startHeight; i <= endHeight; i++) {
        all.push(i)
      }

      const availableBlocks: number[] = map(res, (item: any) => item.height)
      this.logger.info('Blocks available count:', availableBlocks.length)

      // Enqueue missing block heights
      const missingBlocks = difference(all, availableBlocks)
      this.logger.info('Blocks missing count:', missingBlocks.length)
      this.emit('blockMetaVerification:missingBlocks', { count: missingBlocks.length })
      missingBlocks.forEach((height: number) => {
        this.enqueueEvaluateBlock(height, this.options.missingEvaluateBlockPriority!)
      })

      // Truncate legacy block meta right away
      const legacyBlockObjs = filter(res, (item: any) => {
        return item.apiLevel < this.BLOCK_META_API_LEVEL
      })
      const legacyBlocks = map(legacyBlockObjs, (item: any) => item.height)
      this.logger.info('Legacy block count:', legacyBlockObjs.length)
      this.emit('blockMetaVerification:legacyBlocks', { count: legacyBlocks.length })
      legacyBlocks.forEach((height: number) => {
        this.storage!.removeBlockMetaByHeight(height)
      })

      // Check if fully sync'ed
      if (this.isReachedMaxHeight()) {
        if (missingBlocks.length === 0 && legacyBlocks.length === 0) {
          this.logger.info('BlockAnalyzer is up to date.')
          this.emit('upToDate')
        }
      }

      // Conclude
      this.isVerifyingBlockMetas = false
      this.emit('blockMetaVerification:complete', { isSuccess: true })
    })
  }

  private doEnqueueEvaluateBlock() {
    this.logger.debug('doEnqueueEvaluateBlock triggered.')

    if (this.isReachedMaxHeight()) {
      this.logger.info(`BlockWritePointer is greater or equal to designated maxHeight [${this.options.maxHeight}]. There will be no enqueue block beyond this point.`)
      return
    }

    while (!this.isReachedMaxHeight() && !this.isReachedMaxQueueLength()) {
      this.increaseBlockWritePointer()
      this.enqueueEvaluateBlock(this.blockWritePointer!, this.options.standardEvaluateBlockPriority!)
    }
  }

  private isReachedMaxHeight(): boolean {
    return !!(this.options.maxHeight && this.blockWritePointer >= this.options.maxHeight)
  }

  private isReachedMaxQueueLength(): boolean {
    return this.blockQueue.length() >= this.options.maxBlockQueueLength!
  }

  private increaseBlockWritePointer() {
    this.logger.debug('increaseBlockWritePointer triggered.')
    this.blockWritePointer += 1
  }

  /**
   * @param priority Lower value, the higher its priority to be executed.
   */
  private enqueueEvaluateBlock(height: number, priority: number) {
    this.logger.debug('enqueueEvaluateBlock triggered. height:', height, 'priority:', priority)

    // if the block height is above the current height, increment the write pointer.
    if (height > this.blockWritePointer) {
      this.logger.debug('height > this.blockWritePointer, blockWritePointer is now:', height)
      this.blockWritePointer = height
    }

    this.blockQueue.push(
      {
        method: this.evaluateBlock.bind(this),
        attrs: {
          height,
        },
        meta: {
          methodName: 'evaluateBlock',
        },
      },
      priority
    )
  }

  private async evaluateBlock(attrs: object): Promise<any> {
    this.logger.debug('evaluateBlock triggered. attrs:', attrs)

    const height: number = (attrs as any).height
    let previousBlock: object | undefined
    if (height > 1) {
      previousBlock = await this.storage!.getBlock(height - 1)
    }

    const block: any = await this.storage!.getBlock(height)
    const blockMeta = {
      height,
      time: block.time,
      size: block.size,
      generationTime: BlockHelper.getGenerationTime(block, previousBlock),
      transactionCount: BlockHelper.getTransactionCount(block),
      apiLevel: this.BLOCK_META_API_LEVEL,
    }

    if (this.options.toEvaluateTransactions) {
      this.enqueueEvaluateTransaction(block)
    }

    await this.storage!.setBlockMeta(blockMeta)
  }

  private enqueueEvaluateTransaction(block: any) {
    this.logger.debug('enqueueEvaluateTransaction triggered.')

    if (!block || !block.tx) {
      this.logger.info('Invalid block object. Skipping...')
      return
    }

    block.tx.forEach((transaction: any) => {
      this.transactionQueue.push(
        {
          method: this.evaluateTransaction.bind(this),
          attrs: {
            height: block.index,
            time: block.time,
            transaction,
          },
          meta: {
            methodName: 'evaluateTransaction',
          },
        },
        this.options.standardEvaluateBlockPriority!
      )
    })
  }

  private async evaluateTransaction(attrs: object): Promise<any> {
    this.logger.debug('evaluateTransaction triggered.')

    const height: number = (attrs as any).height
    const time: number = (attrs as any).time
    const tx: any = (attrs as any).transaction

    const transactionMeta = {
      height,
      time,
      txid: tx.txid,
      type: tx.type,
      apiLevel: this.TRANSACTION_META_API_LEVEL,
    }

    await this.storage!.setTransactionMeta(transactionMeta)
  }
}
