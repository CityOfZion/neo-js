import { EventEmitter } from 'events'
import { priorityQueue, AsyncPriorityQueue } from 'async'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge, map, difference } from 'lodash'
import { MemoryStorage } from '../storages/memory-storage'
import { MongodbStorage } from '../storages/mongodb-storage'
import { BlockHelper } from '../helpers/block-helper'

const MODULE_NAME = 'BlockMetaAnalyzer'
const DEFAULT_OPTIONS: BlockMetaAnalyzerOptions = {
  minHeight: 1,
  maxHeight: undefined,
  startOnInit: true,
  analyzeQueueConcurrency: 5,
  enqueueBlockIntervalMs: 5000,
  verifyBlockMetasIntervalMs: 10000,
  maxQueueLength: 3000,
  standardEnqueueBlockPriority: 5,
  loggerOptions: {},
}

export interface BlockMetaAnalyzerOptions {
  minHeight?: number
  maxHeight?: number
  startOnInit?: boolean
  analyzeQueueConcurrency?: number
  enqueueBlockIntervalMs?: number
  verifyBlockMetasIntervalMs?: number
  maxQueueLength?: number
  standardEnqueueBlockPriority?: number
  loggerOptions?: LoggerOptions
}

export class BlockMetaAnalyzer extends EventEmitter {
  private apiLevel = 1 // A flag to determine version of the metadata (akin to Android API level)
  private _isRunning = false
  private queue: AsyncPriorityQueue<object>
  private blockWritePointer: number = 0
  private storage?: MemoryStorage | MongodbStorage
  private options: BlockMetaAnalyzerOptions
  private logger: Logger
  private enqueueAnalyzeBlockIntervalId?: NodeJS.Timer
  private blockMetaVerificationIntervalId?: NodeJS.Timer
  private isVerifyingBlockMetas = false

  constructor(storage?: MemoryStorage | MongodbStorage, options: BlockMetaAnalyzerOptions = {}) {
    super()

    // Associate required properties
    this.storage = storage

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.queue = this.getPriorityQueue(this.options.analyzeQueueConcurrency!)
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
      this.logger.info('BlockMetaAnalyzer has already started.')
      return
    }

    if (!this.storage) {
      this.logger.info('Unable to start BlockMetaAnalyzer when no storage are defined.')
      return
    }

    this.logger.info('Start BlockMetaAnalyzer.')
    this._isRunning = true
    this.emit('start')

    this.initAnalyzeBlock()
    this.initBlockMetaVerification()
  }

  stop() {
    if (!this._isRunning) {
      this.logger.info('BlockMetaAnalyzer is not running at the moment.')
      return
    }

    this.logger.info('Stop BlockMetaAnalyzer.')
    this._isRunning = false
    this.emit('stop')

    clearInterval(this.enqueueAnalyzeBlockIntervalId!)
    clearInterval(this.blockMetaVerificationIntervalId!)
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

  private initAnalyzeBlock() {
    this.logger.debug('initAnalyzeBlock triggered.')
    this.setBlockWritePointer()
      .then(() => {
        // Enqueue blocks for analyzing
        this.enqueueAnalyzeBlockIntervalId = setInterval(() => {
          this.doEnqueueAnalyzeBlock()
        }, this.options.enqueueBlockIntervalMs!)
      })
      .catch((err: any) => {
        this.logger.warn('storage.getBlockCount() failed. Error:', err.message)
      })
  }

  private setBlockWritePointer(): Promise<void> {
    this.logger.debug('setBlockWritePointer triggered.')

    return new Promise((resolve, reject) => {
      this.storage!.getBlockMetaCount()
        .then((height: number) => {
          this.logger.debug('getBlockMetaCount success. height:', height)
          if (this.options.minHeight && height < this.options.minHeight) {
            this.logger.info(`storage height is smaller than designated minHeight. BlockWritePointer will be set to minHeight [${this.options.minHeight}] instead.`)
            this.blockWritePointer = this.options.minHeight
          } else {
            this.blockWritePointer = height
          }
          resolve()
        })
        .catch((err: any) => {
          this.logger.warn('storage.getBlockMetaCount() failed. Error:', err.message)
          this.logger.info('Assumed that there are no blocks.')
          this.blockWritePointer = this.options.minHeight!
          resolve()
        })
    })
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
    this.logger.info('queue.length:', this.queue.length())

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
    this.storage!.analyzeBlockMetas(startHeight, endHeight)
      .then((res: any) => {
        this.logger.debug('Analyzing block metas complete!')
        // this.logger.warn('analyzeBlockMetas res:', res)

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
          this.enqueueAnalyzeBlock(height, this.options.standardEnqueueBlockPriority!)
        })

        // TODO: Check for apiLevel


        // Check if fully sync'ed
        if (this.isReachedMaxHeight()) {
          if (missingBlocks.length === 0) {
            this.logger.info('BlockMetaAnalyzer is up to date.')
            this.emit('upToDate')
          }
        }

        // Conclude
        this.isVerifyingBlockMetas = false
        this.emit('blockMetaVerification:complete', { isSuccess: true })
      })
  }

  private doEnqueueAnalyzeBlock() {
    this.logger.debug('doEnqueueAnalyzeBlock triggered.')

    if (this.isReachedMaxHeight()) {
      this.logger.info(`BlockWritePointer is greater or equal to designated maxHeight [${this.options.maxHeight}]. There will be no enqueue block beyond this point.`)
      return
    }

    while (!this.isReachedMaxHeight() && !this.isReachedMaxQueueLength()) {
      this.increaseBlockWritePointer()
      this.enqueueAnalyzeBlock(this.blockWritePointer!, this.options.standardEnqueueBlockPriority!)
    }
  }

  private isReachedMaxHeight(): boolean {
    return !!(this.options.maxHeight && this.blockWritePointer >= this.options.maxHeight)
  }

  private isReachedMaxQueueLength(): boolean {
    return this.queue.length() >= this.options.maxQueueLength!
  }

  private increaseBlockWritePointer() {
    this.logger.debug('increaseBlockWritePointer triggered.')
    this.blockWritePointer += 1
  }

  /**
   * @param priority Lower value, the higher its priority to be executed.
   */
  private enqueueAnalyzeBlock(height: number, priority: number) {
    this.logger.debug('enqueueAnalyzeBlock triggered. height:', height, 'priority:', priority)

    this.queue.push(
      {
        method: this.analyzeBlock.bind(this),
        attrs: {
          height,
        },
        meta: {
          methodName: 'analyzeBlock',
        },
      },
      priority
    )
  }

  private analyzeBlock(attrs: object): Promise<any> {
    this.logger.debug('analyzeBlock triggered. attrs:', attrs)

    const height: number = (attrs as any).height
    let previousBlockTimestamp: number | undefined = undefined

    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then((): object | undefined => {
          if (height === 1) {
            // No need to fetch previous block
            return Promise.resolve()
          } else {
            return this.storage!.getBlock(height-1)
          }
        })
        .then((previousBlock: object | undefined) => {
          if (previousBlock) {
            previousBlockTimestamp = (previousBlock as any).time
          }
          // this.logger.debug('previousBlock type:', typeof(previousBlock), 'previousBlockTimestamp:', previousBlockTimestamp)
          return Promise.resolve()
        })
        .then(() => this.storage!.getBlock(height))
        .then((block: any) => {
          const blockMeta = {
            height: height,
            time: block.time,
            size: block.size,
            generationTime: BlockHelper.getGenerationTime(block, previousBlockTimestamp),
            transactionCount: BlockHelper.getTransactionCount(block),
            apiLevel: this.apiLevel, 
          }
          // this.logger.debug('blockMeta:', blockMeta)
          return Promise.resolve(blockMeta)
        })
        .then((blockMeta: any) => this.storage!.setBlockMeta(blockMeta))
        .then(() => resolve())
        .catch((err: any) => reject(err))
    })
  }
}
