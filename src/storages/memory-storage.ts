import { EventEmitter } from 'events'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge, find } from 'lodash'

const MODULE_NAME = 'MemoryStorage'
const DEFAULT_OPTIONS: MemoryStorageOptions = {
  loggerOptions: {},
}

export interface MemoryStorageOptions {
  loggerOptions?: LoggerOptions
}

interface BlockItem {
  height: number
  block: object
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
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.setReady()

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

  setBlockCount(height: number): Promise<void> {
    this._blockHeight = height
    return Promise.resolve()
  }

  countBlockRedundancy(height: number): Promise<number> {
    throw new Error('Not implemented.')
  }

  getBlock(height: number): Promise<object> {
    const blockItem = find(this.blockCollection, { height })
    if (blockItem) {
      return Promise.resolve(blockItem.block)
    } else {
      return Promise.reject(new Error('Block not found.'))
    }
  }

  setBlock(height: number, block: object, options: object = {}): Promise<void> {
    this.blockCollection.push({ height, block })
    return Promise.resolve()
  }

  pruneBlock(height: number, redundancySize: number): Promise<void> {
    throw new Error('Not implemented.')
  }

  analyzeBlocks(startHeight: number, endHeight: number): Promise<object[]> {
    throw new Error('Not implemented.')
  }

  getBlockMetaCount(): Promise<number> {
    throw new Error('Not implemented.')
  }

  setBlockMeta(blockMeta: object): Promise<void> {
    throw new Error('Not implemented.')
  }

  analyzeBlockMetas(startHeight: number, endHeight: number): Promise<object[]> {
    throw new Error('Not implemented.')
  }

  disconnect(): Promise<void> {
    this.logger.debug('disconnect triggered.')
    return Promise.resolve()
  }

  private setReady() {
    this._isReady = true
    this.emit('ready')
  }

  private validateOptionalParameters() {
    // TODO
  }
}
