module.exports = function(network){
  var module = {};

  var mongoose = require('mongoose');
  var bSchema = mongoose.Schema;


  var collection = {
    'blockchain': 'b_neo_t_blocks',
    'accounts': 'b_neo_t_accounts',
    'contracts': 'b_neo_t_contracts'
  };

  if (network == 'mainnet'){
    collection.blockchain = 'b_neo_m_blocks';
    collection.accounts = 'b_neo_m_accounts';
    collection.contracts = 'b_neo_m_contracts';
  }

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
