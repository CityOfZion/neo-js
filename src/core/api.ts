import { EventEmitter } from 'events'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge } from 'lodash'
import { Mesh } from './mesh'
import { NodeMeta } from './node'
import { MemoryStorage } from '../storages/memory-storage'
import { MongodbStorage } from '../storages/mongodb-storage'
import C from '../common/constants'
import { NeoValidator } from '../validators/neo-validator'

const MODULE_NAME = 'Api'
const DEFAULT_OPTIONS: ApiOptions = {
  insertToStorage: true,
  checkReadyIntervalMs: 200,
  loggerOptions: {},
}

export interface ApiOptions {
  insertToStorage?: boolean
  checkReadyIntervalMs?: number
  loggerOptions?: LoggerOptions
}

interface StorageInsertPayload {
  method: string
  nodeMeta: NodeMeta | undefined
  result: any
}

export class Api extends EventEmitter {
  private mesh: Mesh
  private storage?: MemoryStorage | MongodbStorage
  private options: ApiOptions
  private logger: Logger
  private checkReadyIntervalId?: NodeJS.Timer

  constructor(mesh: Mesh, storage?: MemoryStorage | MongodbStorage, options: ApiOptions = {}) {
    super()

    // Associate required properties
    this.mesh = mesh
    this.storage = storage

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    this.checkMeshAndStorageReady()

    // Event handlers
    this.on('storage:insert', this.storageInsertHandler.bind(this))

    this.logger.debug('constructor completes.')
  }

  async getBlockCount(): Promise<number> {
    this.logger.debug('getBlockCount triggered.')
    if (!this.storage) {
      this.logger.debug('No storage delegate detected.')
      return this.getBlockCountFromMesh()
    }

    let blockHeight: number | undefined
    try {
      blockHeight = await this.storage!.getBlockCount()
      return blockHeight
    } catch (err) {
      // Suppress error and continue
    }

    // Failed to fetch from storage, try mesh instead
    this.logger.debug('Cannot find result from storage delegate, attempt to fetch from mesh instead...')
    blockHeight = await this.getBlockCountFromMesh()
    this.logger.debug('Successfully fetch result from mesh.')
    this.emit('storage:insert', { method: C.rpc.getblockcount, result: blockHeight })
    return blockHeight
  }

  async getBlock(height: number): Promise<object> {
    this.logger.debug('getBlock triggered. height:', height)

    NeoValidator.validateHeight(height)

    if (!this.storage) {
      this.logger.debug('No storage delegate detected.')
      return this.getBlockFromMesh(height)
    }

    let block: object | undefined
    try {
      block = await this.storage!.getBlock(height)
      return block
    } catch (err) {
      // Suppress error and continue
      this.logger.debug('Cannot find result from storage delegate. Error:', err.message)
    }

    // Failed to fetch from storage, try mesh instead
    this.logger.debug('Attempt to fetch from mesh instead...')
    const blockResponse: any = await this.getBlockAndNodeMetaFromMesh(height)
    this.logger.debug('Successfully fetch result from mesh.')
    block = blockResponse.block
    const nodeMeta = blockResponse.nodeMeta
    this.emit('storage:insert', { method: C.rpc.getblock, result: { height, block }, nodeMeta })
    return block!
  }

  async getTransaction(transactionId: string): Promise<object> {
    this.logger.debug('getBlock triggered. transactionId:', transactionId)

    NeoValidator.validateTransactionId(transactionId)

    if (!this.storage) {
      this.logger.debug('No storage delegate detected.')
      return this.getTransactionFromMesh(transactionId)
    }

    let transaction: object | undefined
    try {
      transaction = await this.storage!.getTransaction(transactionId)
      return transaction
    } catch (err) {
      // Suppress error and continue
      this.logger.debug('Cannot find result from storage delegate. Error:', err.message)
    }

    // Failed to fetch from storage, try mesh instead
    this.logger.debug('Attempt to fetch from mesh instead...')
    transaction = await this.getTransactionFromMesh(transactionId)
    return transaction
  }

  close() {
    clearInterval(this.checkReadyIntervalId!)
  }

  private storageInsertHandler(payload: StorageInsertPayload) {
    if (!this.options.insertToStorage) {
      return
    }

    this.logger.debug('storageInsertHandler triggered.')
    if (payload.method === C.rpc.getblockcount) {
      this.storeBlockCount(payload)
    } else if (payload.method === C.rpc.getblock) {
      this.storeBlock(payload)
    } else {
      // TODO
      throw new Error('Not implemented.')
    }
  }

  private validateOptionalParameters() {
    // TODO
  }

  private checkMeshAndStorageReady() {
    this.logger.debug('checkMeshAndStorageReady triggered.')

    /**
     * The easiest implementation to asynchronously detects readiness
     * of multiple components, is to just periodically ping them until
     * all are stated to be ready.
     */
    this.checkReadyIntervalId = setInterval(() => {
      const meshReady = this.mesh.isReady()
      const storageReady = this.storage ? this.storage.isReady() : true
      if (meshReady && storageReady) {
        this.emit('ready')
        clearInterval(this.checkReadyIntervalId!)
      }
    }, this.options.checkReadyIntervalMs!)
  }

  private storeBlockCount(payload: StorageInsertPayload) {
    if (this.storage) {
      const blockHeight = payload.result as number
      this.storage.setBlockCount(blockHeight)
    }
  }

  private storeBlock(payload: StorageInsertPayload) {
    if (this.storage) {
      const height = payload.result.height as number
      const block = payload.result.block as object
      const source = payload.nodeMeta ? payload.nodeMeta.endpoint : 'api:storeBlock'
      this.storage.setBlock(height, block, { source })
    }
  }

  private async getBlockCountFromMesh(): Promise<number> {
    this.logger.debug('getBlockCountFromMesh triggered.')

    const highestNode = this.mesh.getHighestNode()
    if (highestNode && highestNode.blockHeight) {
      return highestNode.blockHeight
    } else {
      // TODO
      throw new Error('Edge case not implemented.')
    }
  }

  private async getBlockFromMesh(height: number): Promise<object> {
    this.logger.debug('getBlockFromMesh triggered.')

    const blockResponse: any = await this.getBlockAndNodeMetaFromMesh(height)
    return blockResponse.block
  }

  private async getBlockAndNodeMetaFromMesh(height: number): Promise<object> {
    this.logger.debug('getBlockAndNodeMetaFromMesh triggered.')

    const highestNode = this.mesh.getHighestNode()
    if (highestNode && highestNode.blockHeight) {
      const nodeMeta = highestNode.getNodeMeta()
      const block = await highestNode.getBlock(height)
      return { block, nodeMeta }
    } else {
      // TODO
      throw new Error('Edge case not implemented.')
    }
  }

  private async getTransactionFromMesh(transactionId: string): Promise<object> {
    this.logger.debug('getTransactionFromMesh triggered.')

    const highestNode = this.mesh.getHighestNode()
    if (highestNode && highestNode.blockHeight) {
      const transaction = await highestNode.getTransaction(transactionId)
      return transaction
    } else {
      // TODO
      throw new Error('Edge case not implemented.')
    }
  }
}
