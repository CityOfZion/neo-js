import { EventEmitter } from 'events'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge } from 'lodash'
import { RpcDelegate } from '../delegates/rpc-delegate'
import C from '../common/constants'
import { NeoValidator } from '../validators/neo-validator'
import { AxiosRequestConfig } from 'axios'

const MODULE_NAME = 'Node'
const DEFAULT_ID = 0
const DEFAULT_OPTIONS: NodeOptions = {
  toBenchmark: true,
  timeout: 5000,
  loggerOptions: {},
}

export interface NodeOptions {
  toBenchmark?: boolean
  timeout?: number
  loggerOptions?: LoggerOptions
}

export class Node extends EventEmitter {
  isActive: boolean | undefined
  pendingRequests: number = 0
  latency: number | undefined // In milliseconds
  blockHeight: number | undefined
  lastSeenTimestamp: number | undefined
  userAgent: string | undefined
  endpoint: string

  private options: NodeOptions
  private logger: Logger

  constructor(endpoint: string, options: NodeOptions = {}) {
    super()

    // Associate required properties
    this.endpoint = endpoint

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)

    // Event handlers
    this.on('query:init', this.queryInitHandler.bind(this))
    this.on('query:success', this.querySuccessHandler.bind(this))
    this.on('query:failed', this.queryFailedHandler.bind(this))

    this.logger.debug('constructor completes.')
  }

  getBlock(height: number, isVerbose: boolean = true): Promise<object> {
    this.logger.debug('getBlock triggered.')

    NeoValidator.validateHeight(height)

    const verboseKey: number = isVerbose ? 1 : 0
    return this.query(C.rpc.getblock, [height, verboseKey])
  }

  getBlockCount(): Promise<object> {
    this.logger.debug('getBlockCount triggered.')
    return this.query(C.rpc.getblockcount)
  }

  getVersion(): Promise<object> {
    this.logger.debug('getVersion triggered.')
    return this.query(C.rpc.getversion)
  }

  private queryInitHandler(payload: object) {
    this.logger.debug('queryInitHandler triggered.')
    if (this.options.toBenchmark) {
      this.increasePendingRequest()
    }
  }

  private querySuccessHandler(payload: any) {
    this.logger.debug('querySuccessHandler triggered.')
    if (this.options.toBenchmark) {
      this.decreasePendingRequest()
      this.lastSeenTimestamp = Date.now()
      this.isActive = true
      if (payload.latency) {
        this.latency = payload.latency
      }
      if (payload.blockHeight) {
        this.blockHeight = payload.blockHeight
      }
      if (payload.userAgent) {
        this.userAgent = payload.userAgent
      }
    }
  }

  private queryFailedHandler(payload: object) {
    this.logger.debug('queryFailedHandler triggered.')
    if (this.options.toBenchmark) {
      this.decreasePendingRequest()
      this.lastSeenTimestamp = Date.now()
      this.isActive = false
    }
  }

  private validateOptionalParameters() {
    // TODO
  }

  private query(method: string, params: any[] = [], id: number = DEFAULT_ID): Promise<object> {
    this.logger.debug('query triggered. method:', method)
    this.emit('query:init', { method, params, id })
    const requestConfig = this.getRequestConfig()
    const t0 = Date.now()
    return new Promise((resolve, reject) => {
      RpcDelegate.query(this.endpoint, method, params, id, requestConfig)
        .then((res: any) => {
          const latency = Date.now() - t0
          const result = res.result
          const blockHeight = method === C.rpc.getblockcount ? result : undefined
          const userAgent = method === C.rpc.getversion ? result.useragent : undefined
          this.emit('query:success', { method, latency, blockHeight, userAgent })
          return resolve(result)
        })
        .catch((err: any) => {
          this.emit('query:failed', { method, error: err })
          return reject(err)
        })
    })
  }

  private increasePendingRequest() {
    this.logger.debug('increasePendingRequest triggered.')
    this.pendingRequests += 1
  }

  private decreasePendingRequest() {
    this.logger.debug('decreasePendingRequest triggered.')
    this.pendingRequests -= 1
  }

  private getRequestConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {}
    if (this.options.timeout) {
      config.timeout = this.options.timeout
    }
    return config
  }
}
