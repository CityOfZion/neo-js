import { EventEmitter } from 'events'
import { priorityQueue } from 'async'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge } from 'lodash'
import { Mesh } from './mesh'
import { MemoryStorage } from '../storages/memory-storage'
import { MongodbStorage } from '../storages/mongodb-storage'
// import C from '../common/constants'

const MODULE_NAME = 'Syncer'
const DEFAULT_OPTIONS: SyncerOptions = {
  startOnInit: true,
  workerCount: 30,
  doEnqueueBlockIntervalMs: 2000,
  maxQueueLength: 10000,
  reQueueDelayMs: 2000,
  loggerOptions: {},
}

export interface SyncerOptions {
  startOnInit?: boolean,
  workerCount?: number,
  doEnqueueBlockIntervalMs?: number,
  maxQueueLength?: number,
  reQueueDelayMs?: number,
  loggerOptions?: LoggerOptions,
}

export class Syncer extends EventEmitter {
  private _isRunning = false
  private queue: any
  private blockWritePointer: number = 0
  private mesh: Mesh
  private storage?: MemoryStorage | MongodbStorage
  private options: SyncerOptions
  private logger: Logger

  constructor(mesh: Mesh, storage?: MemoryStorage | MongodbStorage, options: SyncerOptions = {}) {
    super()

    // Associate required properties
    this.mesh = mesh
    this.storage = storage

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.queue = this.getPriorityQueue()
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

    this.logger.debug('Start syncer.')
    this._isRunning = true
    this.emit('start')

    // TODO
    this.initEnqueueBlock()
    // this.initBlockVerification()
    // this.initAssetVerification()
  }

  stop() {
    if (!this._isRunning) {
      this.logger.info('Syncer is not running at the moment.')
      return
    }

    this.logger.debug('Stop syncer.')
    this._isRunning = false
    this.emit('stop')

    // TODO
  }

  private storeBlockCompleteHandler(payload: any) {
    if (payload.isSuccess === false) {
      this.logger.debug('storeBlockCompleteHandler !isSuccess triggered.')
      setTimeout(() => { // Re-queue the method when failed after an injected delay
        this.enqueueBlock(payload.height)
      }, this.options.reQueueDelayMs!)
    }
  }

  private getPriorityQueue(): any {
    /**
     * @param {object} task
     * @param {string} task.method
     * @param {object} task.attrs
     * @param {function} callback
     */
    return priorityQueue((task: object, callback: Function) => {
      const method: Function = (<any> task).method
      const attrs: Object = (<any> task).attrs
      this.logger.debug('new worker for queue.')

      method(attrs)
        .then(() => {
          callback()
          this.logger.info('queued method run completed.')
          this.emit('syncer:run:complete', { isSuccess: true, task })
        })
        .catch((err: Error) => {
          this.logger.warn(`Task execution error. Method: [${method}]. Continue...`)
          this.logger.info('Error:', err)
          callback()
          this.emit('syncer:run:complete', { isSuccess: false, task })
        })
    }, this.options.workerCount!)
  }

  private initEnqueueBlock() {
    this.logger.debug('initEnqueueBlock triggered.')
    
    this.storage!.getBlockCount()
      .then((height: number) => {
        this.logger.debug('getBlockCount success. height:', height)
        this.blockWritePointer = height

        setInterval(() => { // Enqueue blocks for download
          this.doEnqueueBlock()
        }, this.options.doEnqueueBlockIntervalMs!)
      })
      .catch((err) => {
        this.logger.warn('storage.getBlockCount() failed. Error:', err.message)
      })
  }

  private doEnqueueBlock() {
    this.logger.debug('doEnqueueBlock triggered.')

    const node = this.mesh.getHighestNode()
    if (node) { // TODO: better way to validate a node
      // TODO: undefined param handler
      while ((this.blockWritePointer! < node.blockHeight!) && (this.queue.length() < this.options.maxQueueLength!)) {
        this.increaseBlockWritePointer()
        this.enqueueBlock(this.blockWritePointer!)
      }
    } else {
      this.logger.error('Unable to find a valid node.')
    }
  }

  private increaseBlockWritePointer() {
    this.logger.debug('increaseBlockWritePointer triggered.')
    this.blockWritePointer += 1
  }

  private enqueueBlock(height: number, priority = 5) {
    this.logger.debug('enqueueBlock triggered. height:', height, 'priority:', priority)
    this.emit('enqueueBlock:init', { height, priority })

    // if the block height is above the current height, increment the write pointer.
    if (height > this.blockWritePointer) {
      this.logger.debug('height > this.blockWritePointer, blockWritePointer is now:', height)
      this.blockWritePointer = height
    }

    // enqueue the block
    this.queue.push({
      method: this.storeBlock.bind(this),
      attrs: {
        height,
      },
    }, priority)
  }

  private storeBlock(attrs: object) {
    this.logger.debug('storeBlock triggered. attrs:', attrs)
    const height: number = (<any> attrs).height

    this.emit('storeBlock:init', { height })
    return new Promise((resolve, reject) => {
      const node = this.mesh.getFastestNode() // TODO: need to pick a node with least pending requests
      if (!node) {
        this.emit('storeBlock:complete', { isSuccess: false, height })
        return reject(new Error('No valid node found.'))
      }

      node.getBlock(height)
        .then((block) => {
          this.storage!.setBlock(height, block, {})
            .then((res) => {
              this.logger.debug('setBlock succeeded. For height:', height)
              this.emit('storeBlock:complete', { isSuccess: true, height })
              return resolve()
            })
            .catch((err) => {
              this.logger.debug('setBlock failed. For height:', height)
              this.emit('storeBlock:complete', { isSuccess: false, height })
              return reject(err)
            })
        })
        .catch((err) => {
          this.logger.debug('getBlock failed. For height:', height)
          this.emit('storeBlock:complete', { isSuccess: false, height })
          return reject(err)
        })
    })
  }
}
