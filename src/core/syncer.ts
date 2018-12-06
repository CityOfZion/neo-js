import { EventEmitter } from 'events'
import { priorityQueue, AsyncPriorityQueue } from 'async'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge, map, difference, filter, take } from 'lodash'
import { Node } from './node'
import { Mesh } from './mesh'
import { MemoryStorage } from '../storages/memory-storage'
import { MongodbStorage } from '../storages/mongodb-storage'

// import C from '../common/constants'

const MODULE_NAME = 'Syncer'
const DEFAULT_OPTIONS: SyncerOptions = {
  minHeight: 1,
  maxHeight: undefined,
  blockRedundancy: 1, // If value is greater than 1, than it'll keep multiple copies of same block as integrity measurement // TODO: to ensure redundant blocks are coming from unique sources
  checkRedundancyBeforeStoreBlock: true, // Perform a count on given height before attempt to store block.
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
}

export interface SyncerOptions {
  minHeight?: number
  maxHeight?: number
  blockRedundancy?: number
  checkRedundancyBeforeStoreBlock?: boolean
  startOnInit?: boolean
  toSyncIncremental?: boolean
  toSyncForMissingBlocks?: boolean
  toPruneRedundantBlocks?: boolean
  storeQueueConcurrency?: number
  pruneQueueConcurrency?: number
  enqueueBlockIntervalMs?: number
  verifyBlocksIntervalMs?: number
  maxStoreQueueLength?: number
  retryEnqueueDelayMs?: number
  standardEnqueueBlockPriority?: number
  retryEnqueueBlockPriority?: number
  missingEnqueueStoreBlockPriority?: number
  enqueuePruneBlockPriority?: number
  maxPruneChunkSize?: number
  loggerOptions?: LoggerOptions
}

export class Syncer extends EventEmitter {
  private _isRunning = false
  private storeQueue: AsyncPriorityQueue<object>
  private pruneQueue: AsyncPriorityQueue<object>
  private blockWritePointer: number = 0
  private mesh: Mesh
  private storage?: MemoryStorage | MongodbStorage
  private options: SyncerOptions
  private logger: Logger
  private enqueueStoreBlockIntervalId?: NodeJS.Timer
  private blockVerificationIntervalId?: NodeJS.Timer
  private isVerifyingBlocks = false

  constructor(mesh: Mesh, storage?: MemoryStorage | MongodbStorage, options: SyncerOptions = {}) {
    super()

    // Associate required properties
    this.mesh = mesh
    this.storage = storage

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.storeQueue = this.getPriorityQueue(this.options.storeQueueConcurrency!)
    this.pruneQueue = this.getPriorityQueue(this.options.pruneQueueConcurrency!)
    if (this.options.startOnInit) {
      this.start()
    }

    // Event handlers
    this.on('storeBlock:complete', this.storeBlockCompleteHandler.bind(this))

    this.logger.debug('constructor completes.')
  }

  isRunning(): boolean {
    return this._isRunning
  }

  start() {
    if (this._isRunning) {
      this.logger.info('Syncer has already started.')
      return
    }

    if (!this.storage) {
      this.logger.info('Unable to start syncer when no storage are defined.')
      return
    }

    this.logger.info('Start syncer. minHeight:', this.options.minHeight!, 'maxHeight:', this.options.maxHeight)
    this._isRunning = true
    this.emit('start')

    this.initStoreBlock()
    this.initBlockVerification()
  }

  stop() {
    if (!this._isRunning) {
      this.logger.info('Syncer is not running at the moment.')
      return
    }

    this.logger.info('Stop syncer.')
    this._isRunning = false
    this.emit('stop')

    clearInterval(this.enqueueStoreBlockIntervalId!)
    clearInterval(this.blockVerificationIntervalId!)
  }

  private storeBlockCompleteHandler(payload: any) {
    if (payload.isSuccess === false) {
      this.logger.debug('storeBlockCompleteHandler !isSuccess triggered.')
      setTimeout(() => {
        // Re-queue the method when failed after an injected delay
        this.enqueueStoreBlock(payload.height, this.options.retryEnqueueBlockPriority!)
      }, this.options.retryEnqueueDelayMs!)
    }
  }

  private validateOptionalParameters() {
    if (!this.options.blockRedundancy) {
      throw new Error('blockRedundancy parameter must be supplied.')
    } else if (this.options.blockRedundancy !== 1) {
      throw new Error('supplied blockRedundancy parameter is invalid. Currently only supports for value [1].')
    }
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

  private initStoreBlock() {
    this.logger.debug('initStoreBlock triggered.')
    this.setBlockWritePointer()
      .then(() => {
        if (this.options.toSyncIncremental) {
          // Enqueue blocks for download periodically
          this.enqueueStoreBlockIntervalId = setInterval(() => {
            this.doEnqueueStoreBlock()
          }, this.options.enqueueBlockIntervalMs!)
        }
      })
      .catch((err: any) => {
        this.logger.warn('storage.getBlockCount() failed. Error:', err.message)
      })
  }

  private doEnqueueStoreBlock() {
    this.logger.debug('doEnqueueStoreBlock triggered.')

    if (this.isReachedMaxHeight()) {
      this.logger.info(`BlockWritePointer is greater or equal to designated maxHeight [${this.options.maxHeight}]. There will be no enqueue block beyond this point.`)
      return
    }

    const node = this.mesh.getHighestNode()
    if (node) {
      // TODO: better way to validate a node
      // TODO: undefined param handler
      while (!this.isReachedMaxHeight() && !this.isReachedHighestBlock(node) && !this.isReachedMaxStoreQueueLength()) {
        this.increaseBlockWritePointer()
        this.enqueueStoreBlock(this.blockWritePointer!, this.options.standardEnqueueBlockPriority!)
      }
    } else {
      this.logger.error('Unable to find a valid node.')
    }
  }

  private isReachedMaxHeight(): boolean {
    return !!(this.options.maxHeight && this.blockWritePointer >= this.options.maxHeight)
  }

  private isReachedHighestBlock(node: Node): boolean {
    return this.blockWritePointer! >= node.blockHeight!
  }

  private isReachedMaxStoreQueueLength(): boolean {
    return this.storeQueue.length() >= this.options.maxStoreQueueLength!
  }

  private async setBlockWritePointer(): Promise<void> {
    this.logger.debug('setBlockWritePointer triggered.')

    try {
      const height = await this.storage!.getBlockCount()
      this.logger.debug('getBlockCount success. height:', height)
      if (this.options.minHeight && height < this.options.minHeight) {
        this.logger.info(`storage height is smaller than designated minHeight. BlockWritePointer will be set to minHeight [${this.options.minHeight}] instead.`)
        this.blockWritePointer = this.options.minHeight
      } else {
        this.blockWritePointer = height
      }
    } catch (err) {
      this.logger.warn('storage.getBlockCount() failed. Error:', err.message)
      this.logger.info('Assumed that there are no blocks.')
      this.blockWritePointer = this.options.minHeight!
    }
  }

  private initBlockVerification() {
    this.logger.debug('initEnqueueBlock triggered.')
    this.blockVerificationIntervalId = setInterval(() => {
      this.doBlockVerification()
    }, this.options.verifyBlocksIntervalMs!)
  }

  private doBlockVerification() {
    this.logger.debug('doBlockVerification triggered.')
    this.emit('blockVerification:init')

    // Queue sizes
    this.logger.info('storeQueue.length:', this.storeQueue.length())
    this.logger.info('pruneQueue.length:', this.pruneQueue.length())

    // Check if this process is currently executing
    if (this.isVerifyingBlocks) {
      this.logger.info('doBlockVerification() is already running. Skip this turn.')
      this.emit('blockVerification:complete', { isSkipped: true })
      return
    }

    // Blocks analysis
    this.isVerifyingBlocks = true
    const startHeight = this.options.minHeight!
    const endHeight = this.options.maxHeight && this.blockWritePointer > this.options.maxHeight ? this.options.maxHeight : this.blockWritePointer
    this.logger.debug('Analyzing blocks in storage...')
    this.storage!.analyzeBlocks(startHeight, endHeight)
      .then((res: object[]) => {
        this.logger.debug('Analyzing blocks complete!')

        const all: number[] = []
        for (let i = startHeight; i <= endHeight; i++) {
          all.push(i)
        }

        const availableBlocks: number[] = map(res, (item: any) => item._id)
        this.logger.info('Blocks available count:', availableBlocks.length)

        // Enqueue missing block heights
        const missingBlocks = difference(all, availableBlocks)
        this.logger.info('Blocks missing count:', missingBlocks.length)
        this.emit('blockVerification:missingBlocks', { count: missingBlocks.length })
        if (this.options.toSyncForMissingBlocks) {
          missingBlocks.forEach((height: number) => {
            this.enqueueStoreBlock(height, this.options.missingEnqueueStoreBlockPriority!)
          })
        }

        // Request pruning of excessive blocks
        const excessiveBlocks = map(filter(res, (item: any) => item.count > this.options.blockRedundancy!), (item: any) => item._id)
        this.logger.info('Blocks excessive redundancy count:', excessiveBlocks.length)
        this.emit('blockVerification:excessiveBlocks', { count: excessiveBlocks.length })
        if (this.options.toPruneRedundantBlocks) {
          const takenBlocks = take(excessiveBlocks, this.options.maxPruneChunkSize!)
          takenBlocks.forEach((height: number) => {
            this.enqueuePruneBlock(height, this.options.blockRedundancy!, this.options.enqueuePruneBlockPriority!)
          })
        }

        // Enqueue for redundancy blocks
        if (this.options.blockRedundancy! > 1) {
          const insufficientBlocks = map(filter(res, (item: any) => item.count < this.options.blockRedundancy!), (item: any) => item._id)
          this.logger.info('Blocks insufficient redundancy count:', insufficientBlocks.length)
          // TODO
          throw new Error('Not Implemented.')
        }

        // Check if fully sync'ed
        const node = this.mesh.getHighestNode()
        if (node) {
          if (this.isReachedMaxHeight() || this.isReachedHighestBlock(node)) {
            if (missingBlocks.length === 0) {
              this.logger.info('Storage is fully synced and up to date.')
              this.emit('upToDate')
            }
          }
        }

        // Conclude
        this.isVerifyingBlocks = false
        this.emit('blockVerification:complete', { isSuccess: true })
      })
      .catch((err: any) => {
        this.logger.info('storage.analyzeBlocks error, but to continue... Message:', err.message)
        this.emit('blockVerification:complete', { isSuccess: false })
        this.isVerifyingBlocks = false
      })
  }

  private increaseBlockWritePointer() {
    this.logger.debug('increaseBlockWritePointer triggered.')
    this.blockWritePointer += 1
  }

  /**
   * @param priority Lower value, the higher its priority to be executed.
   */
  private enqueueStoreBlock(height: number, priority: number) {
    this.logger.debug('enqueueStoreBlock triggered. height:', height, 'priority:', priority)

    // if the block height is above the current height, increment the write pointer.
    if (height > this.blockWritePointer) {
      this.logger.debug('height > this.blockWritePointer, blockWritePointer is now:', height)
      this.blockWritePointer = height
    }

    // enqueue the block
    this.storeQueue.push(
      {
        method: this.storeBlock.bind(this),
        attrs: {
          height,
        },
        meta: {
          methodName: 'storeBlock',
        },
      },
      priority
    )
  }

  /**
   * @param priority Lower value, the higher its priority to be executed.
   */
  private enqueuePruneBlock(height: number, redundancySize: number, priority: number) {
    this.logger.debug('enqueuePruneBlock triggered. height:', height, 'redundancySize:', redundancySize, 'priority:', priority)

    this.pruneQueue.push(
      {
        method: this.pruneBlock.bind(this),
        attrs: {
          height,
          redundancySize,
        },
        meta: {
          methodName: 'pruneBlock',
        },
      },
      priority
    )
  }

  private async storeBlock(attrs: object): Promise<any> {
    this.logger.debug('storeBlock triggered. attrs:', attrs)

    const height: number = (attrs as any).height
    const node = this.mesh.getOptimalNode(height)
    this.emit('storeBlock:init', { height })

    try {
      // Validate redundancy level
      if (this.options.checkRedundancyBeforeStoreBlock) {
        const redundantCount = await this.storage!.countBlockRedundancy(height)
        if (redundantCount >= this.options.blockRedundancy!) {
          this.logger.debug('setBlock skipped. height:', height)
          this.emit('storeBlock:complete', { isSkipped: true, height })
          return
        }
      }

      // Validate dependencies
      if (!node) {
        this.emit('storeBlock:complete', { isSuccess: false, height })
        throw new Error('No valid node found.')
      }

      // Fetch and store block
      const block = await node!.getBlock(height)
      const source = node!.endpoint
      const userAgent = node!.userAgent
      await this.storage!.setBlock(height, block, { source, userAgent })
      this.logger.debug('storeBlock succeeded. height:', height)
      this.emit('storeBlock:complete', { isSuccess: true, height })

    } catch (err) {
      this.logger.debug('storeBlock failed. height:', height, 'Message:', err.message)
      this.emit('storeBlock:complete', { isSuccess: false, height })
      throw err
    }
  }

  private async pruneBlock(attrs: object): Promise<void> {
    this.logger.debug('pruneBlock triggered. attrs:', attrs)

    const height: number = (attrs as any).height
    const redundancySize: number = (attrs as any).redundancySize
    await this.storage!.pruneBlock(height, redundancySize)
  }
}
