import { EventEmitter } from 'events'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge } from 'lodash'
import { Mesh, MeshOptions } from './core/mesh'
import { Node, NodeOptions } from './core/node'
import { Api, ApiOptions } from './core/api'
import { Syncer, SyncerOptions } from './core/syncer'
import { MemoryStorage, MemoryStorageOptions } from './storages/memory-storage'
import { MongodbStorage, MongodbStorageOptions } from './storages/mongodb-storage'
import { EndpointValidator } from './validators/endpoint-validator'
import profiles from './common/profiles'
import C from './common/constants'

const version = require('../package.json').version // tslint:disable-line

const MODULE_NAME = 'Neo'
const DEFAULT_OPTIONS: NeoOptions = {
  network: C.network.testnet,
  loggerOptions: {},
}

export interface NeoOptions {
  network?: string
  storageType?: string
  endpoints?: object[]
  nodeOptions?: NodeOptions
  meshOptions?: MeshOptions
  storageOptions?: MemoryStorageOptions | MongodbStorageOptions
  apiOptions?: ApiOptions
  syncerOptions?: SyncerOptions
  loggerOptions?: LoggerOptions
}

export class Neo extends EventEmitter {
  mesh: Mesh
  storage?: MemoryStorage | MongodbStorage
  api: Api
  syncer: Syncer

  private options: NeoOptions
  private logger: Logger

  constructor(options: NeoOptions = {}) {
    super()

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.logger.info('Version:', Neo.VERSION)
    this.mesh = this.getMesh()
    this.storage = this.getStorage()
    this.api = this.getApi()
    this.syncer = this.getSyncer()

    this.logger.debug('constructor completes.')
  }

  static get VERSION(): string {
    return version
  }

  static get UserAgent(): string {
    return `NEO-JS:${Neo.VERSION}`
  }

  close() {
    this.logger.debug('close triggered.')
    if (this.syncer) {
      this.syncer.stop()
    }
    if (this.mesh) {
      this.mesh.stopBenchmark()
    }
    if (this.storage) {
      this.storage.disconnect()
    }
  }

  private validateOptionalParameters() {
    // TODO
  }

  private getMesh(): Mesh {
    this.logger.debug('getMesh triggered.')
    const nodes = this.getNodes()
    return new Mesh(nodes, this.options.meshOptions)
  }

  private getStorage(): MemoryStorage | MongodbStorage | undefined {
    this.logger.debug('getStorage triggered.')
    if (!this.options.storageType) {
      // No storage
      return undefined
    } else if (this.options.storageType === C.storage.memory) {
      return new MemoryStorage(this.options.storageOptions)
    } else if (this.options.storageType === C.storage.mongodb) {
      const mongoStorageOptions = merge({}, this.options.storageOptions, { userAgent: Neo.UserAgent })
      return new MongodbStorage(mongoStorageOptions)
    } else {
      throw new Error(`Unknown storageType [${this.options.storageType}]`)
    }
  }

  private getApi(): Api {
    this.logger.debug('getApi triggered.')
    return new Api(this.mesh, this.storage, this.options.apiOptions)
  }

  private getSyncer(): Syncer {
    this.logger.debug('getSyncer triggered.')
    return new Syncer(this.mesh, this.storage, this.options.syncerOptions)
  }

  private getNodes(): Node[] {
    this.logger.debug('getNodes triggered.')
    // Fetch endpoints
    let endpoints: object[] = []
    if (this.options.endpoints) {
      EndpointValidator.validateArray(this.options.endpoints)
      endpoints = this.options.endpoints
    } else if (this.options.network === C.network.testnet) {
      endpoints = profiles.rpc.testnet
    } else if (this.options.network === C.network.mainnet) {
      endpoints = profiles.rpc.mainnet
    } else {
      throw new Error('Invalid network or provided endpoints.')
    }

    // Instantiate nodes
    const nodes: Node[] = []
    endpoints.forEach((item) => {
      const node = new Node((<any>item).endpoint, this.options.nodeOptions)
      nodes.push(node)
    })

    return nodes
  }
}
