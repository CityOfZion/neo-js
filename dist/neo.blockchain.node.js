/**
 * @ngdoc controller
 * @name neo.blockchain.conf
 * @requires axios
 * @description
 * A controller which defines the neo blockchain connection settings.
 * @param {String} network the network to connect to.
 * Options: 'testnet', 'mainnet'
 */
module.exports = function(network) {
  var module = {
    nodes: []
  };

  var axios = require('axios');

  //identify which network to configure for.
  var neoPort = 20332;
  var cozPort = 8880;
  var cozNetwork = 'test';
  var nodes = [];
  if (network == 'mainnet') {
    neoPort = 10332;
    cozPort = 8080;
    cozNetwork = 'seed';
  }

  //Neo Council Seeds
  var neoSeeds = [
    'http://seed1.neo.org',
    'http://seed2.neo.org',
    'http://seed3.neo.org',
    'http://seed4.neo.org',
    'http://seed5.neo.org',
    'http://seed8.antshares.org',
    'http://api.otcgo.cn'];

  //build the list of neo-maintained nodes
  neoSeeds.forEach(function (domain) {
    module.nodes.push(new node(
      {
        domain: domain,
        port: neoPort
      }
    ))
  });

  //build the list of CoZ maintained nodes
  var cozNodes = [1, 2, 3, 4, 5].map(function (i) {
    var domain = 'http://' + cozNetwork + i + '.cityofzion.io';
    module.nodes.push(new node(
      {
        domain: domain,
        port: cozPort,
      }
    ))
  });

 /**
  * @ngdoc prototype
  * @name node
  * @methodOf neo.blockchain.conf
  * @description
  * prototype class defining a node on the neo blockchain.
  *@param {Object} conf Configuration parameters for the node.
  *@example
  * node({'domain': 'http://seed1.neo.org', 'port': 10332})
  */
  function node(conf) {
    this.domain = conf.domain;
    this.port = conf.port;
    this.age = 0;
    this.active = true;
    this.latency = 0;
    this.blockHeight = 0;
    this.index = -1;
    this.connections = 0;
    this.pendingRequests = 0;
    var node = this;

    this.getBalance = function(asset_id){
     return new Promise(function(resolve, reject){
       var failOver = false;

       node.call({
         method: "getbalance",
         params: [],
         id: 0
         })
         .then(function (data) {
           resolve(data.result);
         })
         .catch(function (err) {
           reject(err);
         })
     })
   };

    this.getBestBlockHash = function(){
     return new Promise(function(resolve, reject){

       this.call({
         method: "getbestblockhash",
         params: [],
         id: 0
         })
         .then(function (data) {
           resolve(data.result);
         })
         .catch(function (err) {
           reject(err);
         })
     })
   };

    /**
    * @ngdoc method
    * @name getBlock
    * @methodOf neo.blockchain.core
    * @description
    * Invokes the getblock rpc request to return a block.  This method
    * accepts and optional node to request the block from.  If a node is not selected,
    * the fastest node will be used with failover in an attempt to guarantee a response.
    *
    * @param {Number} index The index of the block being requested.
    * @param {node} [node] The node to request the block from.
    * @returns {Promise} A promise returning the hex contents of the block
    */
    this.getBlock = function(index){
     return new Promise(function(resolve, reject){
       node.call({
         method: "getblock",
         params: [index,1],
         id: 0})
         .then(function(data){
           resolve(data.result);
         })
         .catch(function(err){
           reject(err)
         });
     })
   };

    /**
    * @ngdoc method
    * @name getBlockCount
    * @methodOf neo.blockchain.core
    * @description
    * Invokes the getblockcount rpc request to return the block height.  This
    * method will request the block height from the fastest active node with failover if a
    * node is not provided.  This method will update the blockHeight attribute
    * on the node it is run on.
    *
    * @param {node} [node] The node that will be polled for its block height.
    * @returns {Promise} A promise returning the block count.
    */
    this.getBlockCount = function(){

      return new Promise(function(resolve, reject){
        node.call({
          method: "getblockcount",
          params: [],
          id: 0
          })
          .then(function (data) {
            node.blockHeight = data.result;
            node.index = data.result - 1;
            resolve(data.result);
          })
          .catch(function (err) {
            return reject(err);
          })
      })
    };

    /**
    * @ngdoc method
    * @name getBlockHash
    * @methodOf neo.blockchain.core
    * @description
    * Invokes the getblockhash rpc request to return a block's hash.  This method
    * accepts and optional node to request the block from.  If a node is not selected,
    * the fastest node will be used with failover in an attempt to guarantee a response.
    *
    * @param {Number} index The index of the block hash being requested.
    * @param {node} [node] The node to request the block from.
    * @returns {Promise} A promise returning the hash of the block
    */
    this.getBlockHash = function(index){

      return new Promise(function(resolve, reject){
        node.call({
          method: "getblockhash",
          params: [index],
          id: 0})
          .then(function(data){
            resolve(data.result);
          })
          .catch(function(err){
            reject(err)
          });
      })
    };

    /**
    * @ngdoc method
    * @name getConnectionCount
    * @methodOf neo.blockchain.core
    * @description
    * Invokes the getconnectioncount rpc request to return the number of connections to
    * the selected node.
    *
    * @param {node} node The node to request the connections of.
    * @returns {Promise} A promise returning the number of connections to the node.
    */
    this.getConnectionCount = function(){

      return new Promise(function(resolve, reject){
        node.call({
          method: "getconnectioncount",
          params: [],
          id: 0
        })
          .then(function (data) {
            node.connections = data.result;
            resolve(data.result);
          })
          .catch(function (err) {
            reject({"message": "Unable to contact the requested node."})
          })
      })
    };

    this.getRawMemPool = function(){
      return new Promise(function(resolve, reject){
        node.call({
          method: "getrawmempool",
          params: [],
          id: 0
        })
          .then(function (data) {
            resolve(data.result);
          })
          .catch(function (err) {
            reject({"message": "Unable to contact the requested node."})
          })
      })
    };

    this.getRawTransaction = function(txid){

      return new Promise(function(resolve, reject){
        node.call({
          method: "getrawtransaction",
          params: [txid],
          id: 0
        })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          reject(err);
        })
      })
    };

    this.getTXOut = function(txid){

      return new Promise(function(resolve, reject){
        node.call({
          method: "gettxout",
          params: [txid],
          id: 0
        })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          reject(err);
        })
      })
    };

    this.sendRawTransaction = function(hex){

      return new Promise(function(resolve, reject){
        node.call({
          method: "sendrawtransaction",
          params: [hex],
          id: 0
        })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          reject(err);
        })
      })
    };

    this.sendToAddress = function(asset_id, address, value){

      return new Promise(function(resolve, reject){
        node.call({
          method: "sendtoaddress",
          params: [asset_id, address, value],
          id: 0
        })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          reject(err);
        })
      })
    };

    this.submitBlock = function(hex){

     return new Promise(function(resolve, reject){
       node.call({
         method: "submitblock",
         params: [hex],
         id: 0
       })
       .then(function (data) {
         resolve(data.result);
       })
       .catch(function (err) {
         reject(err);
       })
     })
   };

   //make an rpc call to the node
    this.call = function (payload) {
      return new Promise(function (resolve, reject) {
        var t0 = Date.now();
        node.pendingRequests ++;
        axios({
          method: 'post',
          url: node.domain + ':' + node.port,
          data: {"jsonrpc": "2.0", "method": payload.method, "params": payload.params, "id": payload.id},
          timeout: 20000
        })
          .then(function (response) {
            node.pendingRequests --;
            node.age = Date.now();
            if (response.data.error) return reject(response.data.error);
            node.latency = node.age - t0;
            node.active = true;
            resolve(response.data);
          })
          .catch(function (err) {
            node.pendingRequests --;
            node.age = Date.now();
            node.active = false;
            return reject(err);
          });
      });
    }


    this.deferredUpdateLoop = function(){
      var base = 5000;
      if (!node.active){
        base = 10000;
      }

      node.getBlockCount()
        .then(function(res){
        })
        .catch(function(err){
        })

      setTimeout(node.deferredUpdateLoop, base + Math.random() * 5000);
    }
    this.deferredUpdateLoop();
  }


  return module
};
