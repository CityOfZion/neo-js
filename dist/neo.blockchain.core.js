/**
 * @ngdoc controller
 * @name neo.blockchain.core
 * @requires lodash
 * @description
 * A controller which defines the neo blockchain prototype.
 * @param {String} mode Sets whether the library should run in full or light mode.
 * @param {String} network Indicates which network to operate the instance on.
 * @example
 * var neoBlockchain = neo('full', 'testnet') //Creates a new full node instance on testnet.
 * @example
 * var neoBlockchain = neo('light', 'mainnet') //Creates a new light node instances on mainnet.
 */

function neo(mode, network){
  var blockchain = this;
  var _ = require('lodash');

  this.nodes = require('./neo.blockchain.conf')(network).nodes;
  this.rpc = require('./neo.blockchain.rpc')(this);
  this.db = require('./neo.blockchain.db')(network);
  this.sync = require('./neo.blockchain.sync')(this);

  this.mode = mode;
  this.network = network;
  this.blockWritePointer = -1;
  var blockchain = this;

  /**
   * @ngdoc method
   * @name updateBlockCount
   * @methodOf neo.blockchain.core
   * @description
   * Polls registered nodes to update their status including whether they are active
   * and what their current block height is.  A fraction of the nodes are randomly selected for update
   * as a way to reduce polling traffic.
   *
   * @returns {Promise}
   */
  this.updateBlockCount = function() {
    return new Promise(function (resolve) {

      var ret = 0;
      var updateCount = 10;
      var used = [];
      var selection = 0;

      //update nodes while the updateCount hasn't be met.
      while (used.length < updateCount) {

        //identify a random unupdated node
        selection = Math.floor(Math.random() * (blockchain.nodes.length));
        if (used.indexOf(selection) != -1) {
          continue;
        }
        used.push(selection);

        //Get the blockcount for the selected node (the rpc call updates the height)
        blockchain.rpc.getBlockCount(blockchain.nodes[selection])
          .catch(function (err) {
          })
          .then(function(){
            ret++;
            //If the sync is over, we're a full node, and the block is above the write pointer,
            //enqueue the block for download.
            if (ret == updateCount) {
              if(blockchain.sync.runLock &&
                (blockchain.blockWritePointer < blockchain.highestNode().blockHeight) &&
                (blockchain.mode == 'full')){
                blockchain.sync.enqueueBlock(blockchain.blockWritePointer + 1, true);
              }
              resolve();
            }
          })
      }
    });
  };
  setInterval(this.updateBlockCount, 10000); //Update the block height metadata of each seed

  /**
   * @ngdoc method
   * @name fastestNode
   * @methodOf neo.blockchain.core
   * @description
   * Identifies and returns the fastest node based on the latency of the last transaction.
   *
   * @returns {node}
   */
  this.fastestNode = function(){
    var activeNodes = _.filter(blockchain.nodes, 'active');
    return _.minBy(activeNodes, 'latency');
  };

  /**
   * @ngdoc method
   * @name highestNode
   * @methodOf neo.blockchain.core
   * @description
   * Identifies and returns the node with the highest blockheight.
   *
   * @returns {node}
   */
  this.highestNode = function(){
    var activeNodes = _.filter(blockchain.nodes, 'active');
    return _.maxBy(activeNodes, 'blockHeight');
  };

  /**
   * @ngdoc method
   * @name nodesWithNode
   * @methodOf neo.blockchain.core
   * @description
   * Identifies and returns the fastest node that has a specific block.
   *
   * @returns {node}
   */
  this.nodeWithBlock = function(index){
    var nodes = _.filter(blockchain.nodes, function(node){
      return (node.active) && (index <= node.blockHeight);
    });
    return _.minBy(nodes, 'latency');
  }

}

exports.neo = neo;


