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
  timeout: 30000,
  loggerOptions: {},
}

export interface NodeMeta {
  isActive: boolean | undefined
  pendingRequests: number | undefined
  latency: number | undefined
  blockHeight: number | undefined
  lastSeenTimestamp: number | undefined
  userAgent: string | undefined
  endpoint: string
}

export interface NodeOptions {
  timeout?: number
  loggerOptions?: LoggerOptions
}

export class Node extends EventEmitter {
  isActive: boolean | undefined
  pendingRequests: number | undefined
  latency: number | undefined // In milliseconds
  blockHeight: number | undefined
  lastSeenTimestamp: number | undefined
  userAgent: string | undefined
  endpoint: string

  private options: NodeOptions
  private logger: Logger
  private isBenchmarking = false

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

  getNodeMeta(): NodeMeta {
    return {
      isActive: this.isActive,
      pendingRequests: this.pendingRequests,
      latency: this.latency,
      blockHeight: this.blockHeight,
      lastSeenTimestamp: this.lastSeenTimestamp,
      userAgent: this.userAgent,
      endpoint: this.endpoint,
    }
  }

  private queryInitHandler(payload: object) {
    this.logger.debug('queryInitHandler triggered.')
    this.startBenchmark(payload)
  }

  private querySuccessHandler(payload: any) {
    this.logger.debug('querySuccessHandler triggered.')
    this.stopBenchmark(payload)
  }

  private queryFailedHandler(payload: object) {
    this.logger.debug('queryFailedHandler triggered.')
    this.stopBenchmark(payload)
  }

  private validateOptionalParameters() {
    // TODO
  }

  private startBenchmark(payload: any) {
    this.logger.debug('startBenchmark triggered.')
    this.increasePendingRequest()

    // Perform latency benchmark when it's a getBlockCount() request
    if (payload.method === C.rpc.getblockcount) {
      if (this.isBenchmarking) {
        this.logger.debug('An benchmarking schedule is already in place. Skipping... endpoint:', this.endpoint)
      } else {
        this.isBenchmarking = true
      }
    }
  }

  private stopBenchmark(payload: any) {
    this.logger.debug('stopBenchmark triggered.')
    this.decreasePendingRequest()
    this.lastSeenTimestamp = Date.now()

    // Store latest active state base on existence of error
    if (payload.error) {
      this.isActive = false
    } else {
      this.isActive = true
    }

    // Store block height value if provided
    if (payload.blockHeight) {
      this.blockHeight = payload.blockHeight
    }

    // Store user agent value if provided
    if (payload.userAgent) {
      this.userAgent = payload.userAgent
    }

    // Perform latency benchmark when it's a getBlockCount() request
    if (payload.method === C.rpc.getblockcount) {
      if (!this.isBenchmarking) {
        this.logger.debug('There are no running benchmarking schedule in place. Skipping... endpoint:', this.endpoint)
      } else {
        this.isBenchmarking = false
        if (payload.latency) {
          this.latency = payload.latency
        }
      }
    }
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
    if (this.pendingRequests) {
      this.pendingRequests += 1
    } else {
      this.pendingRequests = 1
    }
  }

  private decreasePendingRequest() {
    this.logger.debug('decreasePendingRequest triggered.')
    if (this.pendingRequests) {
      this.pendingRequests -= 1
    } else {
      this.pendingRequests = 0
    }
  }

  private getRequestConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {}
    if (this.options.timeout) {
      config.timeout = this.options.timeout
    }
    return config
  }
}
