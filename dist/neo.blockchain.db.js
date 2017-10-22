module.exports = function(network){
  var module = {};

  var mongoose = require('mongoose');
  var _ = require('lodash');

  //Outlines the collections to use for testnet (default)
  var collection = {
    'blockchain': 'b_neo_t_blocks', //The blockchain collection
    'transactions': 'b_neo_t_transactions', //the transactions on the blockchains
    'addresses': 'b_neo_t_addresses', //A collection maintaining accounts and their balances
  };
  if (network == 'mainnet'){
    collection.blockchain = 'b_neo_m_blocks';
    collections.transactions = 'b_neo_m_transactions';
    collection.addresses = 'b_neo_m_addresses';
  }

  var bSchema = mongoose.Schema;

  //Schema defining a destructed block
  var blockSchema = new bSchema({
    hash: String,
    size: Number,
    version: Number,
    previousblockhash: String,
    merkleroot: String,
    time: Number,
    index: {type: 'Number', unique : true, required : true, dropDups: true},
    nonce: String,
    nextconsensus: String,
    script:
      { invocation: String,
        verification: String },
    tx:[],
    confirmations: Number,
    nextblockhash: String
  });
  module.blocks = mongoose.model(collection.blockchain, blockSchema);

  var transactionSchema = new bSchema({
    txid: {type: 'String', unique : true, required : true, dropDups: true, index: true},
    size: Number,
    type: {type: 'String', index: true},
    version: Number,
    attributes: [],
    vin: [],
    vout: [],
    sys_fee: Number,
    net_fee: Number,
    blockIndex: {type: 'Number', index: true},
    scripts: [] })
  module.transactions = mongoose.model(collection.transactions, transactionSchema);

  var addressSchema = new bSchema({
    address: {type: 'String', unique : true, required : true, dropDups: true},
    asset: 'String',
    type: 'String',
    assets: [],
    history: []
  })
  module.addresses = mongoose.model(collection.addresses, addressSchema);

  /**
   * @class node
   * @variation 2
   * @description
   * A class defining a local node on the neo blockchain.
   */
  module.node = function node(){
    this.domain = 'localhost';
    this.active = true;
    this.latency = 0;
    this.blockHeight = 0;
    this.index = -1;
    this.connections = 0;
    this.pendingRequests = 0;
    this.unlinkedBlocks = [];
    this.assets = [];
    var node = this;

    /**
     * Gets the balance of all assets and tokens for an address.  This method will return the
     * complete balance sheet for an account unless only a subset of assets is requested.  The
     * method also supports an optional blockAge attribute which will act as a caching mechanism to reduce
     * compute load.
     * @param {String} address A contract address to get the balance of.
     * @param {Array} [assets = node.assets] An array of the assets to return balances for.
     * @param {Number} [blockAge = 1]  getBalance uses a caching mechanic to reduce node load.  If
     * An asset's balance for an account has not been updated withing 'blockAge' blocks, it will retrieve an
     * updated value.  Increasing this number and substantial reduce computer load at the expense
     * of balance discretization.
     * @returns Promise.<Array> An array containing the balances of an address.
     */
    this.getBalance = ( { address, assets = node.assets, blockAge = 1} ) =>
    new Promise( (resolve, reject) => {
        module.addresses.findOne({'address': address})
          .exec( (err, res) => {
            if (err) reject(err)

            //If the address is not found in the database, its new...So add it and retry.
            if (!res) {
              module.addresses({'address': address, 'type': 'c', 'assets': []})
                .save( (res) => {
                  node.getBalance(address)
                  .then((res) => {
                    resolve(res);
                  })
                })
            }
            else {
              //Sort the assets into 'current' and 'needs update'
              var parts = _.partition(res.assets, (asset) =>
                (node.index - asset.index) >= blockAge
              );
              //If there is an asset list discripancy, scan for missing assets to update.
              //This mechanic is used to automatically add new asset support as
              //an asset it appears in a transaction.
              if (res.assets.length != node.assets.length){
                var included = _.map(res.assets, 'asset');
                node.assets.forEach( (asset) => {
                  if (included.indexOf(asset.asset) === -1) {
                    parts[0].push({
                      'asset': asset.asset,
                    })
                  }
                })
              }

              //Update stale balances and resolve
              Promise.all(parts[0].map( (asset) =>
                node.getAssetBalance({address, asset: asset.asset, startBlock: asset.index + 1, balance: asset.balance})
              ))
              .then( (res) =>
                resolve(parts[1].concat(res))
              );
            }
          })
      })

    /**
     * Gets the balance of an asset belonging to a specific address
     * on the blockchain.  This method will also cache the result to the
     * addresses collection.
     * @param {String} address The address to find the balance of.
     * @param {String} asset The asset to look up.
     * @param {Number} [startBlock = 0] the block start start the calculation from.
     * @param {Number} [balance = 0] the balance at the startBlock.
     * @returns Promise.<object> An object containing the asset balance.
     */
    this.getAssetBalance = ( {address, asset, startBlock = 0, balance = 0} ) =>
    new Promise( (resolve, reject) => {
      //find all transactions involving the requested asset and address
      module.transactions.find({
        'vout.address': address,
        $or: [{'type': 'ContractTransaction'},
          {'type': 'InvocationTransaction'},
          {'type': 'ClaimTransaction'}],
        'vout.asset': asset,
        'blockIndex': {'$gte': startBlock}
      }, 'txid').sort('blockIndex')
        .exec( (err, res) => {
          if (err) return reject(err);
          Promise.all( _.map(res, 'txid').map(node.getExpandedTX) )
            .then( (res)  => {
              res.forEach( (r) => {
                r.vout.forEach((output) => {
                  if ((output.address === address) &&
                    (output.asset === asset)) {
                    balance += output.value;
                  }
                })
                r.vin.forEach((input) => {
                  if ((input.address === address) &&
                    (input.asset === asset)) {
                    balance -= input.value;
                  }
                })
              })
              //update the address balances in the collection
              var result = {'asset': asset, 'balance': balance, 'index': node.index, 'type': 'a'};
              module.addresses.update({'address': address, 'assets.asset': asset}, {
                'assets.$.balance': balance,
                'assets.$.index': node.index
              }).exec((err, res) => {
                //if no asset was updated, the asset must be new, append it
                if (res.n == 0) {
                  module.addresses.update({'address': address}, {'$push': {'assets': result}})
                    .exec((err, res) => {
                      resolve(result)
                    })
                } else resolve(result);
              })

            }).catch( (err) => reject(err) )
        })
    })

    this.getExpandedTX = function(txid){
      return new Promise(function(resolve, reject){
        node.getTX(txid)
          .then(function(tx) {
            if (!tx) return reject("Could not find the transaction");

            //If the tx has already been expanded, return it
            if (tx.vin.some(function(entry){ return _.has(entry, 'asset')})){
              resolve(tx);
              return;
            }

            newVin = []
            Promise.all(_.map(tx.vin, 'txid').map(node.getTX))
              .then(function(res){
                tx.vin = _.map(res, function(r, i){ return r.vout[tx.vin[i].vout] });
                module.transactions.update({'txid': tx.txid}, tx, function(err){
                  if (err) console.log(err);
                });
                resolve(tx);
              })
              .catch(function(err){
                console.log(err);
              })
          })
          .catch(function(err){
            console.log(err);
          })
      })
    }

    this.getTX = function(txid){
      return new Promise(function(resolve, reject){
        if (txid.length > 64){
          txid = txid.slice(2);
        };
        module.transactions.findOne({ $or:[ {'txid': txid}, {'txid': '0x' + txid}] })
          .exec(function(err, res){
            if (err) return reject(err);
            if (!res) return reject('transaction not found');
            resolve(res)
          })
      })
    };

    this.getBestBlockHash = function(){};

    this.getBlock = function(index){
      return new Promise(function(resolve, reject){
        module.blocks.findOne({'index': index})
          .exec(function(err, res){
            if (err) return reject(err);
            if (!res) return reject('Block not found');
            resolve(res);
          })
      })
    };

    this.getBlockCount = function(){
      return new Promise(function(resolve, reject){
        module.blocks.findOne({}, 'index')
          .sort('-index')
          .exec(function (err, res) {
            if (err) return reject(err);
            if (!res) res = {'index': -1};
            node.index = res.index;
            node.blockHeight = res.index + 1;
            resolve(node.blockHeight);
          })
      })
    };

    this.getBlockHash = function(index){};

    this.getConnectionCount = function(){};

    this.getRawMemPool = function(){};

    this.getTXOut = function(txid){
    };

    this.sendRawTransaction = function(){};

    this.sendToAddress = function(asset_id, address, value){};

    this.submitBlock = function(){};

    this.saveBlock = function(newBlock) {
      return new Promise(function (resolve, reject) {

        //Store the raw block
        newBlock = delintBlock(newBlock);
        module.blocks(newBlock).save(function (err) {
          if (err) return reject(err);

          //Store the raw transaction
          newBlock.tx.forEach(function(tx){
            tx.blockIndex = newBlock.index;
            tx.vout.forEach(function(d) {
              if (node.assetsFlat.indexOf(d.asset) == -1) {
                module.addresses({'address': d.asset, 'asset': d.asset, 'type': 'a', 'assets': []}).save();
              }
            })

            module.transactions(tx).save(function(err){
              if (err) console.log(err);
            });
          })

          //Because we asynchronously sync the blockchain,
          //we need to keep track of the blocks that have been stored
          //(higher indices could arrive before the lower ones)
          //This code maintains the local blockheight by tracking
          //'linked' and 'unlinked'(but stored) blocks
          if (newBlock.index > node.index) {
            node.unlinkedBlocks.push(newBlock.index);
            var linkIndex = -1;
            while (true){
              linkIndex = node.unlinkedBlocks.indexOf(node.index + 1);
              if (linkIndex != -1){
                node.unlinkedBlocks.splice(linkIndex,1);
                node.index++;
                node.blockHeight++;
              }
              else break;
            }
          }
          resolve();
        })

      })
    }

    function delintBlock(block){
      block.hash = hexFix(block.hash);
      block.previousblockhash = hexFix(block.previousblockhash)
      block.merkleroot = hexFix(block.merkleroot)
      block.tx.forEach(function(tx){
        tx.txid = hexFix(tx.txid);
        tx.sys_fee = parseFloat(tx.sys_fee);
        tx.net_fee = parseFloat(tx.net_fee);

        tx.vout.forEach(function(vout){
          vout.asset = hexFix(vout.asset)
          vout.value = parseFloat(vout.value);
        })
      })
      return block
    }

    function hexFix(hex){
      if (hex.length == 64){
        hex = '0x' + hex
      }
      return hex
    }

    this.verifyBlocks = function(start = 0, end = node.index){
      console.log('Blockchain Verification: Starting');
      return new Promise(function(resolve, revoke){
        var missing = [];
        var pointer = -1;
        module.blocks.find({}, 'index').sort('index')
          .exec(function(err,res){
            console.log('Blockchain Verification: Scanning');
            res.forEach(function(d){
              while (true){
                pointer ++;
                if (d.index == pointer) break
                else{
                  missing.push(pointer);
                }
              }
            })
            console.log('Blockchain Verification: Found ' + missing.length + ' missing');
            resolve(missing)
          })
      })

    }

    this.getBlockCount();

    var updateAssetList = function() {
      module.addresses.find({'type': 'a'}, 'asset')
        .exec(function (err, res) {
          node.assets = res;
          node.assetsFlat = _.map(res, 'asset')
        })
    }
    updateAssetList();
    setInterval(updateAssetList, 10000);

  }

  return module
};
