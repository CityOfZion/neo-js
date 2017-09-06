/**
 * @ngdoc controller
 * @name neo.blockchain.core
 * @requires lodash
 * @requires neo.blockchain.conf
 * @description
 * A controller which defines the neo blockchain prototype.
 * @param {String} mode Sets whether the library should run in full or light mode.
 * Options: 'full' , 'light'
 * @param {String} network Indicates which network to operate the instance on.
 * Options: 'testnet', 'mainnet'
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
      while (used.length < updateCount) {
        selection = Math.floor(Math.random() * (blockchain.nodes.length));
        if (used.indexOf(selection) != -1) {
          continue;
        }
        used.push(selection);
        blockchain.rpc.getBlockCount(blockchain.nodes[selection])
          .catch(function (err) {
          })
          .then(function(){
            ret++;
            if (ret == updateCount) {
              resolve();
            }
          })
      }
    });
  };
  setInterval(this.updateBlockCount, 10000);

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

  this.highestNode = function(){
    var activeNodes = _.filter(blockchain.nodes, 'active');
    return _.maxBy(activeNodes, 'blockHeight');
  };

  this.nodeWithBlock = function(index){
    var nodes = _.filter(blockchain.nodes, function(node){
      return (node.active) && (index < node.blockHeight);
    });
    return _.minBy(nodes, 'latency');
  }


}

exports.neo = neo;


