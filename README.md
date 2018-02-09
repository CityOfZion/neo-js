<p align="center">
  <img 
    src="http://res.cloudinary.com/vidsy/image/upload/v1503160820/CoZ_Icon_DARKBLUE_200x178px_oq0gxm.png" 
    width="125px"
    alt="City of Zion logo">
</p>

<p align="center" style="font-size: 32px;">
  <strong>neo-js</strong>
</p>

<p align="center">
  A package for running a node on the <b>neo</b> blockchain.
</p>

<p align="center">
  <a href="https://travis-ci.org/CityOfZion/neo-js">
    <img src="https://travis-ci.org/CityOfZion/neo-js.svg?branch=master" alt="Build Status">
  </a>
  <a href="https://badge.fury.io/js/%40cityofzion%2Fneo-js">
    <img src="https://badge.fury.io/js/%40cityofzion%2Fneo-js.svg" alt="npm version">
  </a>
</p>

## Overview

The `neo-js` package is designed to interface with the **Neo** blockchain in a number of different ways that are configured by options that are used to initialize a node. A few examples of these different interaction mechanics are defined in the quickstart below as well as in the examples.

**note:** All blockchain events (Invocation and Deploy) use the RPC calls to interface with the blockchain unless they can be run locally (sometimes referred to as a 'test invoke')

## A note on local storage

Currently this module only support MongoDB for synchronizing the blockchain.  Future storage types are planning including other NoSQL databases, SQL databases, and in-memory solutions.

This module uses 'lazy caching' to improve performance when using local storage. Blocks are initially downloaded and stored in three collections (blocks, transactions, and addresses) as a result of the sync process. Upon the first request for a specific transaction (as a result of any number of the methods), the transaction will be expanded as [described in Neon wallet architecture](https://github.com/CityOfZion/neon-wallet-db/blob/master/docs/Overview.md) and updated in the collection. The next time the block is requested, the expanded transaction will already be available in the collection.

This mechanic is also used for address balances. Upon requesting an update for an asset balance, the transaction collection is analyzed and the asset balance is stored in an account collection along with the max block height during the calculation. Upon future requests for the asset balance, the asset collection is first queried for previous balance.  The asset balance is then updated using only the new blocks since the previous calculation event.

## System Recommendations

* NodeJS 8+
* MongoDB 3.0+

## Installation

Install the package using:

```bash
$ npm install --save @cityofzion/neo-js
```

Alternatively, to access to the latest available code, you can reference to the git repository directly:

```bash
$ npm install --save CityOfZion/neo-js#develop
```

**note:** `neo-js` requires that MongoDB server is installed to run the instance as a full node.
Installation instructions can be found in [MongoDB installation manual](https://docs.mongodb.com/manual/installation/).

## Quick Start

```js
const Node = require('@cityofzion/neo-js')
```

To create a new blockchain instance:

```js
// create the local node instance that will interface with the rpc methods
const nodeT = new Node({ network: 'testnet' }) //on testnet
const nodeM = new Node({ network: 'mainnet' }) //on mainnet

nodeT.mesh.rpc('getBlock', 1000) //get block 1000 from testnet
nodeM.mesh.rpc('getBlock', 1000) //get block 1000 from mainnet
```

This will create a new node instance and configure it to sync the blockchain to a 3 mongoDB collections that we define:

```js
const options = {
  network: 'testnet',
  storage: {
    model: 'mongoDB',
    collectionNames: {
      blocks: 'b_neo_t_blocks',
      transactions: 'b_neo_t_transactions',
      addresses: 'b_neo_t_addresses'
    }
  }
}

// create the local node instance and get the local block count after 5 seconds.
const node = new Node(options)

setTimeout(() => {
  node.storage.getBlockCount()
    .then( (res) => console.log(res) )
}, 5000)
```

## Documentation

Documentation (incomplete) for the project can be found at:

* http://cityofzion.io/neo-js/

Self-documented code examples are available as part of the project source code:

* https://github.com/CityOfZion/neo-js/blob/master/examples

## Contribution

`neo-js` always encourages community code contribution. Before contributing please read the [contributor guidelines](https://github.com/CityOfZion/neo-js/blob/master/.github/CONTRIBUTING.md) and search the issue tracker as your issue may have already been discussed or fixed. To contribute, fork `neo-js`, commit your changes and submit a pull request.

By contributing to `neo-js`, you agree that your contributions will be licensed under its MIT license.

## License

* Open-source [MIT](https://github.com/CityOfZion/neo-js/blob/master/LICENSE.md).
* Main author is [@lllwvlvwlll](https://github.com/lllwvlvwlll).
