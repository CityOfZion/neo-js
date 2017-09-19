<p align="center">
  <img 
    src="http://res.cloudinary.com/vidsy/image/upload/v1503160820/CoZ_Icon_DARKBLUE_200x178px_oq0gxm.png" 
    width="125px;">
</p>

<h1 align="center">neo-js-blockchain</h1>

<p align="center">
  A package for running a full or light node on the <b>neo</b> blockchain.
</p>


## Overview
The neo-js-blockchain package is designed to interface with the **neo** blockchain in two modes on both 'testnet' and 'mainnet':

### full ###

In full mode, the package will sync the blockchain and derivative collections to a local mongo instance.  In this mode, requests will be returned from the local database if the database is able to resolve the request.

### light ###

In light mode, the package will interface with other full nodes using the seed rpc calls to acquire data.

**note:** All blockchain events (Invocation and Deploy) use the rpc calls to interface with the blockchain unless they can be run locally (sometimes referred to as a 'test invoke')

<b>Click [here](http://cityofzion.io/neo-js-blockchain/index.html) for full documentation.</b>

This module uses 'lazy caching' to improve performance in full-node mode.  Blocks are initially downloaded and stored in two collections (one for the raw blockchain and another for the raw transactions) as a result of the sync process.  Upon the first request for a specific transaction (as a result of any number of the methods), the transaction will be expanded as described <b>[here](https://github.com/CityOfZion/neon-wallet-db/blob/master/docs/Overview.md)</b> and updated in the collection.  The next time the block is requested, the expanded transaction will already be available in the collection.

This mechanic is also used for address balances.  Upon requesting an update for an asset balance, the transaction collection is analyzed and the asset balance is stored in an account collection along with the max blockheight during the calculation.  Upon future requests for the asset balance, the asset collection is first queried for previous balance.  The asset balance is then updated using only the new blocks since the previous calculation event.

This mechanic will also be expanded to NEP5 tokens in the future.


## Installation
Install the package using:

```bash
$ npm install neo-js-blockchain --save
```

**note:** neo-js-blockchain requires that mongodb is installed to run the instance as a full node.
Installation instructions can be found [here](https://docs.mongodb.com/manual/installation/).


## Quickstart

```js
var neo = require('neo-js-blockchain');
```

To create a new blockchain instance:
```js
var neoBlockchain = neo('full', 'testnet');
```
This will create a new testnet instance and configure it to run as a full node.

Additionally, to create a light node instance on mainnet:
```js
var neoBlockchain = neo('light', 'mainnet');
```

To begin synchronizing the blockchain if the instance is a full node:
```js
neoBlockchain.sync.start();
```
To pause:
```js
neoBlockchain.sync.stop();
```

When running, synchronization will continue to maintain blocks as they are generated on the blockchain.  An event will also periodically run to verify all of the blocks in the chain.

Calls to the local database will be extended in v0.0.4.  Currently, running rpc calls using a helper function will automatically select the best candidate for the request against both the local and remote nodes:
```js
neoBlockchain.nodeWithBlock(index, 'latency').getBalance('XXX');
```
will return the balance of account 'XXX' from the fastest node with the requested block, including the local chain.

**In full-node mode:**
```js
blockchainNeo.localNode.getAssetBalance(Address, 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b')
    .then(function (res) {
      console.log(res);
      //{ asset: 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
      //  balance: 1111 }
 })
 ```
 will respond with the balance of an asset owned by the requested address. 
 

