# Event Emitters

Possible events emitters per class.

### `neo`

* N/A

### `core/api`

* `ready`
* `storage:insert`

### `core/mesh`

* `ready`

### `core/syncer`

* `start`
* `stop`
* `query:worker:complete`
* `blockVerification:init`
* `blockVerification:complete`
* `blockVerification:missingBlocks`
* `blockVerification:excessiveBlocks`
* `storeBlock:init`
* `storeBlock:complete`
* `upToDate`

### `core/node`

* `query:init`
* `query:complete`

### `storages/memory-storage`

* `ready`

### `storages/mongodb-storage`

* `ready`
* `reviewIndexes:init`
* `reviewIndexes:complete`

### `analyzers/block-meta-analyzer`

* `start`
* `stop`
* `query:worker:complete`
* `blockMetaVerification:init`
* `blockMetaVerification:complete`
* `blockMetaVerification:missingBlocks`
* `blockMetaVerification:excessiveBlocks`
* `upToDate`
