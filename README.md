<p align="center">
  <img 
    src="http://res.cloudinary.com/vidsy/image/upload/v1503160820/CoZ_Icon_DARKBLUE_200x178px_oq0gxm.png" 
    width="125px;">
</p>

<h1 align="center">neo-js</h1>

<p align="center">
  A package for running a full or light node on the <b>neo</b> blockchain.
</p>

## Overview

The `neo-js` package is designed to interface with the **Neo** blockchain in two modes on both 'testnet' and 'mainnet':

### Full Mode ###

In full mode, the package will sync the blockchain and derivative collections to a local MongoDB instance. In this mode, requests will be returned from the local database if the database is able to resolve the request.

### Light Mode ###

In light mode, the package will interface with other full nodes using the seed RPC calls to acquire data.

**note:** All blockchain events (Invocation and Deploy) use the RPC calls to interface with the blockchain unless they can be run locally (sometimes referred to as a 'test invoke')

This module uses 'lazy caching' to improve performance in full-node mode. Blocks are initially downloaded and stored in two collections (one for the raw blockchain and another for the raw transactions) as a result of the sync process. Upon the first request for a specific transaction (as a result of any number of the methods), the transaction will be expanded as [described in Neon wallet architecture](https://github.com/CityOfZion/neon-wallet-db/blob/master/docs/Overview.md) and updated in the collection. The next time the block is requested, the expanded transaction will already be available in the collection.

This mechanic is also used for address balances. Upon requesting an update for an asset balance, the transaction collection is analyzed and the asset balance is stored in an account collection along with the max block height during the calculation. Upon future requests for the asset balance, the asset collection is first queried for previous balance.  The asset balance is then updated using only the new blocks since the previous calculation event.

This mechanic will also be expanded to NEP5 tokens.

## Installation

Install the package using:

```bash
$ npm install --save neo-js-blockchain
```

**note:** `neo-js` requires that MongoDB server is installed to run the instance as a full node.
Installation instructions can be found in [MongoDB installation manual](https://docs.mongodb.com/manual/installation/).

## Quick Start

```js
var Neo = require('neo-js-blockchain')
```

To create a new blockchain instance:

```js
var neoBlockchain = new Neo('full', 'testnet')
```

This will create a new 'testnet' instance and configure it to run as a full node.

Additionally, to create a light node on 'mainnet':

```js
var neoBlockchain = new Neo('light', 'mainnet')
```

To begin synchronizing the blockchain if the instance is a full node:

```js
neoBlockchain.sync.start();
```

To pause:

```js
neoBlockchain.sync.stop();
```

When running, synchronization will continue to maintain blocks as they are generated on the blockchain.

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

## Donations

Accepted at __ATEMNPSjRVvsXmaJW4ZYJBSVuJ6uR2mjQU__
