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

In full mode, the package will sync the blockchain to a local mongo instance.  In this mode, requests will be returned from the local database if the database has been fully synchronized.

### light ###

In light mode, the package will interface with other full nodes using the seed rpc calls to acquire data.

**note:** All blockchain events (Invocation and Deploy) use the rpc calls to interface with the blockchain unless they can be run locally (sometimes referred to as a 'test invoke')

## Installation
Install the package using:

```bash
$ npm install neo-js-blockchain --save
```

**note:** neo-js-blockchain requires that mongodb is installed to run the instance as a full node.
Installation instructions can be found [here](https://docs.mongodb.com/manual/installation/).


## Using neo-js-blockchain

```js
var neo = require('neo-js-blockchain');
```

To create a new blockchain instance:
```js
var neoBlockchain = neo('full', 'testnet');
```
This will create a new testnet instance and configure it to run as a full node.

Additionally, to create a light node on mainnet:
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


