import { EventEmitter } from 'events'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge, find } from 'lodash'

const MODULE_NAME = 'MemoryStorage'
const DEFAULT_OPTIONS: MemoryStorageOptions = {
  loggerOptions: {},
}

export interface MemoryStorageOptions {
  loggerOptions?: LoggerOptions,
}

interface BlockItem {
  height: number,
  block: object,
}

export class MemoryStorage extends EventEmitter {
  private _isReady = false
  private _blockHeight?: number
  private blockCollection: BlockItem[] = []
  private options: MemoryStorageOptions
  private logger: Logger

  constructor(options: MemoryStorageOptions = {}) {
    super()

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this._isReady = true

    this.logger.debug('constructor completes.')
  }

  isReady(): boolean {
    return this._isReady
  }

  getBlockCount(): Promise<number> {
    if (this._blockHeight) {
      return Promise.resolve(this._blockHeight)
    } else {
      return Promise.reject(new Error('blockHeight unavailable'))
    }
  }

  setBlockCount(blockHeight: number) {
    // TODO: change this to return promise instead
    this._blockHeight = blockHeight
  }

  getBlock(height: number): Promise<object> {
    const blockItem = find(this.blockCollection, { height })
    if (blockItem) {
      return Promise.resolve(blockItem.block)
    } else {
      return Promise.reject(new Error('Block not found.'))
    }
  }

  setBlock(height: number, block: object, source: object): Promise<void> {
    this.blockCollection.push({ height, block })
    return Promise.resolve()
  }

  disconnect(): Promise<void> {
    this.logger.debug('disconnect triggered.')
    return Promise.resolve()
  }
}
