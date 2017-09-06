/**
 * @ngdoc controller
 * @name neo.blockchain.rpc
 * @description
 * A controller which defines the neo blockchain rpc calls.  Most of the methods
 * support both greedy w/ failover and explicit requests to nodes.
 * @param {neo} blockchain reference to the parent neo prototype.
 */
module.exports = function(blockchain){

  var module = {};

  module.getBalance = function(asset_id, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node) reject({"message": "Could not identify an active node"});

      node.call({
        method: "getbalance",
        params: [],
        id: 0
      })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            module.getBalance(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
        })
    })
  };

  module.getBestBlockHash = function(node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node) reject({"message": "Could not identify an active node"});

      node.call({
        method: "getbestblockhash",
        params: [],
        id: 0
      })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            module.getBestBlockHash(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
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
  module.getBlock = function(index, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.nodeWithBlock(index);
        failOver = true;
      }
      if (!node) reject('Could not identify an active node');

      node.call({
        method: "getblock",
        params: [index,1],
        id: 0})
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(){
          if (failOver) {
            module.getBlock(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function(err){
                reject(err);
              })
          }
          else{
            reject({'message': 'Could not connect to the requested server'})
          }
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
  module.getBlockCount = function(node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node) reject({"message": "Could not identify an active node"});

      node.call({
        method: "getblockcount",
        params: [],
        id: 0
      })
        .then(function (data) {
          node.blockHeight = data.result;
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            module.getBlockCount(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
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
  module.getBlockHash = function(index, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.nodeWithBlock(index);
        failOver = true;
      }
      if (!node) reject('Could not identify an active node');

      node.call({
        method: "getblockhash",
        params: [index],
        id: 0})
        .then(function(data){
          resolve(data.result);
        })
        .catch(function(){
          if (failOver) {
            module.getBlockHash(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function(err){
                reject(err);
              })
          }
          else{
            reject({'message': 'Could not connect to the requested server'})
          }
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
  module.getConnectionCount = function(node){
    return new Promise(function(resolve, reject){
      if (!node) reject({"message": "Could not identify an active node"});

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

  module.getRawMemPool = function(node){
    return new Promise(function(resolve, reject){
      if (!node) reject({"message": "Could not identify an active node"});

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

  module.getRawTransaction = function(txid, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node) reject({"message": "Could not identify an active node"});

      node.call({
        method: "getrawtransaction",
        params: [txid],
        id: 0
      })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            blockchain.getRawTransaction(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
        })
    })
  };

  module.getTXOut = function(txid, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node){
        reject({"message": "Could not identify an active node"});
      }

      node.call({
        method: "gettxout",
        params: [txid],
        id: 0
      })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            module.getTXOut(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
        })
    })
  };

  module.sendRawTransaction = function(hex, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node){
        reject({"message": "Could not identify an active node"});
      }

      node.call({
        method: "sendrawtransaction",
        params: [hex],
        id: 0
      })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            module.sendRawTransaction(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
        })
    })
  };

  module.sendToAddress = function(asset_id, address, value, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node){
        reject({"message": "Could not identify an active node"});
      }

      node.call({
        method: "sendtoaddress",
        params: [asset_id, address, value],
        id: 0
      })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            module.sendToAddress(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
        })
    })
  };

  module.submitBlock = function(hex, node){
    return new Promise(function(resolve, reject){
      var failOver = false;
      if (!node){
        node = blockchain.fastestNode();
        failOver = true;
      }

      if (!node){
        reject({"message": "Could not identify an active node"});
      }

      node.call({
        method: "submitblock",
        params: [hex],
        id: 0
      })
        .then(function (data) {
          resolve(data.result);
        })
        .catch(function (err) {
          if (failOver) {
            module.submitBlock(index)
              .then(function (data) {
                resolve(data);
              })
              .catch(function (err) {
                reject(err);
              })
          }
          else {
            reject({"message": "Unable to contact the requested node."})
          }
        })
    })
  };

  return module
};

