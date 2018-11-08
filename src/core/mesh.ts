import { EventEmitter } from 'events'
import { Logger, LoggerOptions } from 'node-log-it'
import { merge, filter, minBy, maxBy, random } from 'lodash'
import { Node } from './node'

const MODULE_NAME = 'Mesh'
const DEFAULT_OPTIONS: MeshOptions = {
  startBenchmarkOnInit: true,
  benchmarkIntervalMs: 2000,
  minActiveNodesRequired: 2,
  loggerOptions: {},
}

export interface MeshOptions {
  startBenchmarkOnInit?: boolean
  benchmarkIntervalMs?: number
  minActiveNodesRequired?: number
  loggerOptions?: LoggerOptions
}

export class Mesh extends EventEmitter {
  nodes: Node[] // Ensure there's at least 1 item in the array

  private _isReady = false
  private benchmarkIntervalId?: NodeJS.Timer
  private options: MeshOptions
  private logger: Logger

  constructor(nodes: Node[], options: MeshOptions = {}) {
    super()

    // Associate required properties
    this.nodes = nodes
    if (this.nodes.length === 0) {
      throw new Error('Mesh must have 1 or more nodes.')
    }

    // Associate optional properties
    this.options = merge({}, DEFAULT_OPTIONS, options)
    this.validateOptionalParameters()

    // Bootstrapping
    this.logger = new Logger(MODULE_NAME, this.options.loggerOptions)
    if (this.options.startBenchmarkOnInit) {
      this.startBenchmark()
    }

    this.logger.debug('constructor completes.')
  }

  isReady(): boolean {
    return this._isReady
  }

  startBenchmark() {
    this.logger.debug('startBenchmark triggered.')

    // Go through and ping all unknown nodes
    const unknownNodes = filter(this.nodes, (n: Node) => n.isActive === undefined)
    this.logger.debug('unknownNodes.length:', unknownNodes.length)
    unknownNodes.forEach((n) => {
      n.getBlockCount()
        .then(() => {
          this.checkMeshReady()
        })
        .catch((err: any) => {
          this.logger.info('node.getBlockCount error, but to continue... Endpoint:', n.endpoint, 'Message:', err.message)
        })
    })

    // Start timer
    this.benchmarkIntervalId = setInterval(() => this.performBenchmark(), <number>this.options.benchmarkIntervalMs)
  }

  stopBenchmark() {
    this.logger.debug('stopBenchmark triggered.')
    if (this.benchmarkIntervalId) {
      clearInterval(this.benchmarkIntervalId)
    }
  }

  getFastestNode(activeOnly = true): Node | undefined {
    this.logger.debug('getFastestNode triggered.')

    let nodePool = activeOnly ? this.listActiveNodes() : this.nodes
    if (nodePool.length === 0) {
      return undefined
    }

    nodePool = filter(nodePool, (n: Node) => n.latency !== undefined)
    if (nodePool.length === 0) {
      return undefined
    }

    return minBy(nodePool, 'latency')
  }

  getHighestNode(activeOnly = true): Node | undefined {
    this.logger.debug('getHighestNode triggered.')

    let nodePool = activeOnly ? this.listActiveNodes() : this.nodes
    if (nodePool.length === 0) {
      return undefined
    }

    nodePool = filter(nodePool, (n: Node) => n.blockHeight !== undefined)
    if (nodePool.length === 0) {
      return undefined
    }

    return maxBy(nodePool, 'blockHeight')
  }

  /**
   * @param activeOnly Toggle to only pick node that is determined to be active.
   */
  getRandomNode(activeOnly = true): Node | undefined {
    this.logger.debug('getRandomNode triggered.')

    const nodePool = activeOnly ? this.listActiveNodes() : this.nodes
    if (nodePool.length === 0) {
      return undefined
    }

    const randomIndex = random(0, nodePool.length - 1)
    return nodePool[randomIndex]
  }

  private validateOptionalParameters() {
    // TODO
  }

  private performBenchmark() {
    this.logger.debug('performBenchmark triggered.')

    // pick and ping a random node
    const node = this.getRandomNode()
    if (node) {
      node.getBlockCount().catch((err) => {
        this.logger.info('node.getBlockCount error in performBenchmark(). Endpoint:', node.endpoint, 'Message:', err.message)
      })
    }
  }

  private checkMeshReady() {
    this.logger.debug('checkMeshReady triggered.')
    const activeNodes = this.listActiveNodes()
    if (!this.options.minActiveNodesRequired || activeNodes.length >= this.options.minActiveNodesRequired) {
      if (!this._isReady) {
        // First signal that mesh is considered as 'ready' state
        this.setReady()
        this.logger.debug('mesh is considered to be now ready.')
      }
    }
  }

  private setReady() {
    this._isReady = true
    this.emit('ready')
  }

  private listActiveNodes(): Node[] {
    return filter(this.nodes, { isActive: true })
  }
}
