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

  return module
};
