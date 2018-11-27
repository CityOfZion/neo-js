import { EventEmitter } from 'events'
// import { priorityQueue, AsyncPriorityQueue } from 'async'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge } from 'lodash'
import { MemoryStorage } from '../storages/memory-storage'
import { MongodbStorage } from '../storages/mongodb-storage'

const MODULE_NAME = 'BlockMetaAnalyzer'
const DEFAULT_OPTIONS: BlockMetaAnalyzerOptions = {
  loggerOptions: {},
}

export interface BlockMetaAnalyzerOptions {
  loggerOptions?: LoggerOptions
}

export class BlockMetaAnalyzer extends EventEmitter {
  private _isRunning = false
  private storage?: MemoryStorage | MongodbStorage
  private options: BlockMetaAnalyzerOptions
  private logger: Logger

  constructor(storage?: MemoryStorage | MongodbStorage, options: BlockMetaAnalyzerOptions = {}) {
    super()

    // Associate required properties
    this.storage = storage

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)

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

    // TODO
  }

  stop() {
    if (!this._isRunning) {
      this.logger.info('BlockMetaAnalyzer is not running at the moment.')
      return
    }

    this.logger.info('Stop BlockMetaAnalyzer.')
    this._isRunning = false
    this.emit('stop')

    // TODO
  }

  private validateOptionalParameters() {
  }
}
