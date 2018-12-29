# Event Emitters

Events emitters per class and possible payload properties.

### `neo`

N/A

&nbsp;

### `core/api`

#### `ready`

```js
null
```

#### `storage:insert`

```js
{
  method: string
  result: any
}
```

&nbsp;

### `core/mesh`

#### `ready`

```js
null
```

&nbsp;

### `core/syncer`

#### `start`

```js
null
```

#### `stop`

```js
null
```

#### `query:worker:complete`

```js
{
  isSuccess: boolean
}
```

#### `blockVerification:init`

```js
null
```

#### `blockVerification:complete`

```js
{
  isSkipped: boolean
}
```

#### `blockVerification:missingBlocks`

```js
{
  count: number
}
```

#### `blockVerification:excessiveBlocks`

```js
{
  count: number
}
```

#### `storeBlock:init`

```js
{
  height: number
}
```

#### `storeBlock:complete`

```js
{
  isSuccess?: boolean
  isSkipped?: boolean
  height: number
}
```

#### `upToDate`

```js
null
```

&nbsp;

### `core/node`

#### `query:init`

```js
{
  method: string
  params: object
  id: string
}
```

#### `query:complete`

```js
{
  isSuccess: boolean
  method: string
  latency?: number
  blockHeight?: number
  userAgent?: string
  error?: object
}
```

&nbsp;

### `storages/memory-storage`

#### `ready`

```js
null
```

&nbsp;

### `storages/mongodb-storage`

#### `ready`

```js
null
```

#### `reviewIndexes:init`

```js
null
```

#### `reviewIndexes:complete`

```js
{
  isSuccess: boolean
}
```

&nbsp;

### `analyzers/block-meta-analyzer`

#### `start`

```js
null
```

#### `stop`

```js
null
```

#### `query:worker:complete`

```js
{
  isSuccess: boolean
  task: object
}
```

#### `blockMetaVerification:init`

```js
null
```

#### `blockMetaVerification:complete`

```js
{
  isSuccess?: boolean
  isSkipped?: boolean
}
```

#### `blockMetaVerification:blockMetas:missing`

```js
{
  count: number
}
```

#### `blockMetaVerification:blockMetas:legacy`

```js
{
  count: number
}
```

#### `blockMetaVerification:transactionMetas:legacy`

```js
{
  metaCount: number
}
```

#### `upToDate`

```js
null
```
