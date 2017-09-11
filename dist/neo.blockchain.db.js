/**
 * @ngdoc controller
 * @name neo.blockchain.db
 * @requires mongoose
 * @description
 * The db controller defines the module model for full nodes.
 */
module.exports = function(network){
  var module = {};

  var mongoose = require('mongoose');
  var bSchema = mongoose.Schema;

  //Outlines the collections to use for testnet (default)
  var collection = {
    'blockchain': 'b_neo_t_blocks', //The blockchain collection
    'accounts': 'b_neo_t_accounts', //A collection maintaining accounts and their balances
    'contracts': 'b_neo_t_contracts' //A collection indexing smart contracts
  };
  if (network == 'mainnet'){
    collection.blockchain = 'b_neo_m_blocks';
    collection.accounts = 'b_neo_m_accounts';
    collection.contracts = 'b_neo_m_contracts';
  }

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

    this.getBalance = function(asset_id){};

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

    this.getTXOut = function(txid){};

    this.sendRawTransaction = function(){};

    this.sendToAddress = function(asset_id, address, value){};

    this.submitBlock = function(){};

    this.saveBlock = function(newBlock) {
      return new Promise(function (resolve, reject) {
        var block = module.blocks(newBlock);
        block.save(function (err) {
          if (err) return reject(err);

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
