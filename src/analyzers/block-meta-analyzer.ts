import { EventEmitter } from 'events'
import { priorityQueue, AsyncPriorityQueue } from 'async'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge } from 'lodash'
import { MemoryStorage } from '../storages/memory-storage'
import { MongodbStorage } from '../storages/mongodb-storage'

const MODULE_NAME = 'BlockMetaAnalyzer'
const DEFAULT_OPTIONS: BlockMetaAnalyzerOptions = {
  minHeight: 1,
  maxHeight: undefined,
  startOnInit: true,
  analyzeQueueConcurrency: 30,
  enqueueBlockIntervalMs: 5000,
  maxQueueLength: 1000,
  standardEnqueueBlockPriority: 5,
  loggerOptions: {},
}

export interface BlockMetaAnalyzerOptions {
  minHeight?: number
  maxHeight?: number
  startOnInit?: boolean
  analyzeQueueConcurrency?: number
  enqueueBlockIntervalMs?: number
  maxQueueLength?: number
  standardEnqueueBlockPriority?: number
  loggerOptions?: LoggerOptions
}

export class BlockMetaAnalyzer extends EventEmitter {
  private _isRunning = false
  private queue: AsyncPriorityQueue<object>
  private blockWritePointer: number = 0
  private storage?: MemoryStorage | MongodbStorage
  private options: BlockMetaAnalyzerOptions
  private logger: Logger
  private enqueueAnalyzeBlockIntervalId?: NodeJS.Timer

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
  }

  private validateOptionalParameters() {
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
      this.storage!.getBlockCount()
        .then((height: number) => {
          this.logger.debug('getBlockCount success. height:', height)
          if (this.options.minHeight && height < this.options.minHeight) {
            this.logger.info(`storage height is smaller than designated minHeight. BlockWritePointer will be set to minHeight [${this.options.minHeight}] instead.`)
            this.blockWritePointer = this.options.minHeight
          } else {
            this.blockWritePointer = height
          }
          resolve()
        })
        .catch((err: any) => {
          this.logger.warn('storage.getBlockCount() failed. Error:', err.message)
          this.logger.info('Assumed that there are no blocks.')
          this.blockWritePointer = this.options.minHeight!
          resolve()
        })
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

    // if the block height is above the current height, increment the write pointer.
    if (height > this.blockWritePointer) {
      this.logger.debug('height > this.blockWritePointer, blockWritePointer is now:', height)
      this.blockWritePointer = height
    }

    // enqueue the block
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
    this.logger.debug('storeBlock triggered. attrs:', attrs)

    const height: number = (attrs as any).height

    // TODO: fetch block from storage
    // TODO: fetch previous block from storage
    // TODO: meta data extraction
    // TODO: store meta data to storage

    /**
     * Block Meta Data:
     * - height
     * - generationSecond
     * - transactionCount
     * - createdBy
     * - apiLevel
     */
    throw new Error('Not implemented')
  }
}
