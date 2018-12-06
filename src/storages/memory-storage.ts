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

  async getBlockCount(): Promise<number> {
    if (this._blockHeight) {
      return this._blockHeight
    } else {
      throw new Error('blockHeight unavailable')
    }
  }

  async setBlockCount(height: number): Promise<void> {
    this._blockHeight = height
  }

  async countBlockRedundancy(height: number): Promise<number> {
    throw new Error('Not implemented.')
  }

  async getBlock(height: number): Promise<object> {
    const blockItem = find(this.blockCollection, { height })
    if (blockItem) {
      return blockItem.block
    } else {
      throw new Error('Block not found.')
    }
  }

  async getTransaction(transactionId: string): Promise<object> {
    throw new Error('Not implemented.')
  }

  async setBlock(height: number, block: object, options: object = {}): Promise<void> {
    this.blockCollection.push({ height, block })
  }

  async pruneBlock(height: number, redundancySize: number): Promise<void> {
    throw new Error('Not implemented.')
  }

  async analyzeBlocks(startHeight: number, endHeight: number): Promise<object[]> {
    throw new Error('Not implemented.')
  }

  async getBlockMetaCount(): Promise<number> {
    throw new Error('Not implemented.')
  }

  async getHighestBlockMetaHeight(): Promise<number> {
    throw new Error('Not implemented.')
  }

  async getHighestBlockMeta(): Promise<object | undefined> {
    throw new Error('Not implemented.')
  }

  async setBlockMeta(blockMeta: object): Promise<void> {
    throw new Error('Not implemented.')
  }

  async analyzeBlockMetas(startHeight: number, endHeight: number): Promise<object[]> {
    throw new Error('Not implemented.')
  }

  async removeBlockMetaByHeight(height: number): Promise<void> {
    throw new Error('Not implemented.')
  }

  async disconnect(): Promise<void> {
    this.logger.debug('disconnect triggered.')
  }

  private setReady() {
    this._isReady = true
    this.emit('ready')
  }

  private validateOptionalParameters() {
    // TODO
  }
}
