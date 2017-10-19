module.exports = function(network){
  var module = {};

  var mongoose = require('mongoose');
  var _ = require('lodash');


  //Outlines the collections to use for testnet (default)
  var collection = {
    'blockchain': 'b_neo_t_blocks', //The blockchain collection
    'transactions': 'b_neo_t_transactions', //the transactions on the blockchains
    'accounts': 'b_neo_t_accounts', //A collection maintaining accounts and their balances
    'contracts': 'b_neo_t_contracts' //A collection indexing smart contracts
  };
  if (network == 'mainnet'){
    collection.blockchain = 'b_neo_m_blocks';
    collection.transactions = 'b_neo_m_transactions';
    collection.accounts = 'b_neo_m_accounts';
    collection.contracts = 'b_neo_m_contracts';
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
    txid: {type: 'String', unique : true, required : true, dropDups: true},
    size: Number,
    type: String,
    version: Number,
    attributes: [],
    vin: [],
    vout: [],
    sys_fee: Number,
    net_fee: Number,
    blockIndex: Number,
    scripts: [] })
  module.transactions = mongoose.model(collection.transactions, transactionSchema);


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
    var node = this;

    this.getAssetBalance = function(address,asset) {
      return new Promise(function (resolve, reject) {

        if (asset.length > 64){
          asset = asset_id.slice(2);
        };
        var balance = 0;

        module.transactions.find({
          'vout.address': address,
          $or: [{'type': 'ContractTransaction'}, {'type': 'InvocationTransaction'}],
          $or:[ {'vout.asset': asset}, {'vout.asset': '0x' + asset}]
        },'txid').sort('blockIndex')
          .exec(function (err, res) {
            if (err) return reject(err);

            Promise.all(_.map(res, 'txid').map(node.getSimplifiedTX))
              .then(function(res){
                res.forEach(function(r){
                  r.forEach(function(simpleTX){
                    if ((simpleTX.address == address) &&
                      ((simpleTX.asset == asset) || (simpleTX.asset.slice(2) == asset))){
                      balance += simpleTX.value;
                    }
                  })
                })
                resolve({
                  'asset': asset,
                  'balance': balance
                });
              })
              .catch(function(err){
                console.log(err);
              })

            })
      })
    }

    this.getSimplifiedTX = function(txid){
      return new Promise(function(resolve, reject) {
        node.getExpandedTX(txid)
          .then(function (tx) {
            tx.vout.forEach(function (output, i) {
              var input = _.find(tx.vin, function (input) {
                return (input.address == output.address) &&
                  ((input.asset == output.asset) || (input.asset.slice(2) == output.asset) || (input.asset == output.asset.slice(2)));
              })
              if (input) {
                tx.vout[i].value = parseFloat(output.value) - parseFloat(input.value);
              } else tx.vout[i].value = parseFloat(tx.vout[i].value);
              tx.vout[i].blockIndex = tx.blockIndex
            })

            resolve(tx.vout);
          })
          .catch(function(err){
            console.log(err);
          })

      })
    }

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

    this.getBalance = function(asset_id){

    }

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
            tx.vout.forEach(function(d){ d.value = parseFloat(d.value)})
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
            console.log(missing);
            resolve(missing)
          })
      })

    }

    this.getBlockCount();
  }

  return module
};
