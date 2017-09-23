
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
  * @class node
  * @variation 1
  * @description
  * A class defining a remote node on the neo blockchain.
  * @param {Object} conf Configuration parameters for the node.
  * Ex: {'domain': 'http://seed1.neo.org', 'port': 10332}
  * @example
  * var n = node({'domain': 'http://seed1.neo.org', 'port': 10332});
  */
  function node(conf) {
    /** {string} The domain of the node */
    this.domain = conf.domain;
    /** {number} The port that the node is operating on. */
    this.port = conf.port;
    /** {number} The last query date represented as seconds since the epoch. */
    this.age = 0;
    /** {boolean} Indicates where the node is active. */
    this.active = true;
    /** {number} The nodes latency(in seconds) as reported by the last transaction. */
    this.latency = 0;
    /** {number} The block height of the node. */
    this.blockHeight = 0;
    /** {number} The block index of the node calculated as this.blockHeight - 1 */
    this.index = -1;
    this.connections = 0;
    this.pendingRequests = 0;
    var node = this;

   /**
    * Gets the NEO and GAS balance of an address.
    * @param {string} asset_id The address to get the balance of.
    * @returns {Promise.<Object>} A promise containing the address balances.
    */
    this.getBalance = function(asset_id){
     return new Promise(function(resolve, reject){

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

    /**
    * Gets the best block hash on the node
    * @returns {Promise.<Object>}
    */
    this.getBestBlockHash = function(){
     return new Promise(function(resolve, reject){

       node.call({
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
    * Invokes the getblock rpc request to return a block.  This method
    * accepts and optional node to request the block from.  If a node is not selected,
    * the fastest node will be used with failover in an attempt to guarantee a response.
    *
    * @param {number} index The index of the block being requested.
    * @returns {Promise.<string>} A promise returning the hex contents of the block
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
    * Invokes the getblock rpc request to return a block.  This method
    * accepts and optional node to request the block from.  If a node is not selected,
    * the fastest node will be used with failover in an attempt to guarantee a response.
    *
    * @param {string} hash The hash of the block being requested.
    * @returns {Promise.<Object>} A promise returning information of the block
    */
    this.getBlockByHash = function(hash){
      return new Promise(function(resolve, reject){
        node.call({
          method: "getblock",
          params: [hash, 1],
          id: 0
        })
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(err){
          reject(err);
        });
      });
    };

    /**
    * Invokes the getblockcount rpc request to return the block height.  This
    * method will request the block height from the fastest active node with failover if a
    * node is not provided.  This method will update the blockHeight attribute
    * on the node it is run on.
    *
    * @returns {Promise.<number>} A promise returning the block count.
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
    * Invokes the getblockhash rpc request to return a block's hash.  This method
    * accepts and optional node to request the block from.  If a node is not selected,
    * the fastest node will be used with failover in an attempt to guarantee a response.
    *
    * @param {number} index The index of the block hash being requested.
    * @returns {Promise.<string>} A promise returning the hash of the block
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
    * Invokes the getblocksysfee rpc request to return system fee.
    *
    * @param {number} index The index of the block hash being requested.
    * @returns {Promise.<number>} The system fee.
    */
    this.getBlockSystemFee = function(height){
      return new Promise(function(resolve, reject){
        node.call({
          method: "getblocksysfee",
          params: [height],
          id: 0
        })
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(err){
          reject(err);
        });
      });
    };

    /**
    * Invokes the getconnectioncount rpc request to return the number of connections to
    * the selected node.
    *
    * @returns {Promise.<number>} A promise returning the number of connections to the node.
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

    /**
    * Polls the node for the raw transaction data associated with an input txid.
    * @param {string} txid The requested transaction ID.
    * @returns {Promise.<Object>} An object containing the transaction information.
    */
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

    /**
    * Polls the node for the raw transaction response associated with an input txid.
    * @param {string} txid The requested transaction ID.
    * @returns {Promise.<Object>} An object containing the transaction response.
    */
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

    /**
    * Submits a raw transaction event to the blockchain.
    * @param {string} hex The hex string representing the raw transaction.
    * @returns {Promise.<Object>} The transaction response.
    */
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

    /**
    * Invokes the getaccountstate rpc request to return information of requested account.
    *
    * @param {string} address The address of the wallet being requested.
    * @returns {Promise.<Object>} An object containing the account information.
    */
    this.getAccountState = function (address) {
      return new Promise(function(resolve, reject){
        node.call({
          method: "getaccountstate",
          params: [address],
          id: 0
        })
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(err){
          reject(err)
        });
      });
    };

    /**
    * Invokes the getassetstate rpc request to return information of requested asset.
    *
    * @param {string} address The address of the asset being requested.
    * @returns {Promise.<Object>} An object containing the asset information.
    */
    this.getAssetState = function (assetId) {
      return new Promise(function(resolve, reject){
        node.call({
          method: "getassetstate",
          params: [assetId],
          id: 0
        })
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(err){
          reject(err)
        });
      });
    };

    /**
    * Invokes the validateaddress rpc request to verify a requested address.
    *
    * @param {string} address The address of the wallet being requested.
    * @returns {Promise.<Object>} An object containing the validation information of the requested account.
    */
    this.validateAddress = function (address) {
      return new Promise(function(resolve, reject){
        node.call({
          method: "validateaddress",
          params: [address],
          id: 0
        })
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(err){
          reject(err)
        });
      });
    };

    /**
    * TBA
    */
    this.getPeers = function () {
      return new Promise(function(resolve, reject){
        node.call({
          method: "getpeers",
          params: [],
          id: 0
        })
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(err){
          reject(err)
        });
      });
    };

    /**
    * Makes an RPC call to the node.*
    * @param {Object} payload An object defining the request.
    * EX: {'method': 'getblock', 'params': [666,1], 'id': 0}
    * @returns {Promise.<Object>} A promise returning the data field of the response.
    * @example
    * node.call({'method': 'getblock', 'params': [666,1], 'id': 0})
    */
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

   /**
    * Runs a deferred update loop to periodically poll (with jitter)
    * the node for its block height.
    */
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
