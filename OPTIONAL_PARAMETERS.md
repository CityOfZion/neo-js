# Optional Parameters

Possible options and default values.

### `neo`

```js
const neoOptions = {
  network: 'testnet',
  storageType: undefined,
  endpoints: undefined,
  enableBlockMetaAnalyzer: false,
  nodeOptions: undefined,
  meshOptions: undefined,
  storageOptions: undefined,
  apiOptions: undefined,
  syncerOptions: undefined,
  blockMetaAnalyzerOptions: undefined,
  loggerOptions: {},
}
```

### `core/api`

```js
const apiOptions = {
  insertToStorage: true,
  checkReadyIntervalMs: 200,
  loggerOptions: {},
}
```

### `core/mesh`

```js
const meshOptions = {
  startBenchmarkOnInit: true,
  toFetchUserAgent: true,
  benchmarkIntervalMs: 2000,
  fetchMissingUserAgentIntervalMs: 5000,
  refreshUserAgentIntervalMs: 5 * 60 * 1000,
  minActiveNodesRequired: 2,
  pendingRequestsThreshold: 5,
  loggerOptions: {},
}
```

### `core/syncer`

```js
const syncerOptions = {
  minHeight: 1,
  maxHeight: undefined,
  blockRedundancy: 1,
  checkRedundancyBeforeStoreBlock: true,
  startOnInit: true,
  toSyncIncremental: true,
  toSyncForMissingBlocks: true,
  toPruneRedundantBlocks: true,
  storeQueueConcurrency: 30,
  pruneQueueConcurrency: 10,
  enqueueBlockIntervalMs: 5000,
  verifyBlocksIntervalMs: 1 * 60 * 1000,
  maxStoreQueueLength: 1000,
  retryEnqueueDelayMs: 5000,
  standardEnqueueBlockPriority: 5,
  retryEnqueueBlockPriority: 3,
  missingEnqueueStoreBlockPriority: 1,
  enqueuePruneBlockPriority: 5,
  maxPruneChunkSize: 1000,
  loggerOptions: {},
}
```

### `core/node`

```js
const nodeOptions = {
  toLogReliability: false,
  truncateRequestLogIntervalMs: 30 * 1000,
  requestLogTtl: 5 * 60 * 1000,
  timeout: 30000,
  loggerOptions: {},
}
```

### `storages/memory-storage`

```js
const memoryStorageOptions = {
  loggerOptions: {},
}
```

### `storages/mongodb-storage`

```js
const mongodbStorageOptions = {
  connectOnInit: true,
  reviewIndexesOnConnect: false,
  userAgent: 'Unknown',
  collectionNames: {
    blocks: 'blocks',
    blockMetas: 'block_metas',
    transactions: 'transactions',
    assets: 'assets',
  },
  loggerOptions: {},
}
```

### `analyzers/block-meta-analyzer`

```js
const blockMetaAnalyzerOptions = {
  minHeight: 1,
  maxHeight: undefined,
  startOnInit: true,
  analyzeQueueConcurrency: 5,
  enqueueBlockIntervalMs: 5 * 1000,
  verifyBlockMetasIntervalMs: 30 * 1000,
  maxQueueLength: 30 * 1000,
  standardEnqueueBlockPriority: 5,
  missingEnqueueBlockPriority: 3,
  loggerOptions: {},
}
```

### `Logger`

```js
const loggerOptions = {
  level: 'warn', // silent | error | warn | info | debug | trace
  displayTimestamp: true,
  displayName: true,
  displayLevel: true,
  useLevelInitial: false,
  useLocalTime: false,
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
}
```
