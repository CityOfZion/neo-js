/**
 * @ngdoc controller
 * @name neo.blockchain.sync
 * @requires async
 * @description
 * The sync controller is responsible for synchronizing the blockchain when running
 * in full node mode.
 */
module.exports = function(blockchain){
  var module = {};

  var async = require('async');
  module.runLock = false;

  var defaultWorkerCount = 10; //The number of blocks to grab in parallel.
  var maxQueueLength = 10000; //maximum supported working queue length. Helps with memory usage during large syncs.
  var logPeriod = 10000; //log sync status every n blocks.

  /**
   * @description
   * Maintains the synchronization queue for the blockchain.
   *
   * @param {object} task the task to be executed in the queue.
   * @param {function} callback
   * @example {'method': function, 'attrs': object}
   *
   * @returns {Lyfe}
   */
  var queue = async.queue(function(task, callback) {

    task.method(task.attrs)
      .then(function() {
        //after a sync even is run, enqueue any other
        // outstanding blocks up to the max queue length.
        while((queue.length() < maxQueueLength) &&
        (blockchain.blockWritePointer < blockchain.highestNode().blockHeight)){
          module.enqueueBlock(blockchain.blockWritePointer + 1);
        }
        //Consider logging a status update...communication is important
        if ((task.attrs.index % logPeriod == 0) ||
        (blockchain.blockWritePointer == blockchain.highestNode().blockHeight)){
          console.log(task.attrs);
        }
        callback();
      })

      .catch(function(err){
        //If the blcok request fails, throw it to the back to the queue to try again.
        //timout prevents inf looping on connections issues etc..
        setTimeout(function() {
            module.enqueueBlock(task.attrs.index);
          }, 3000)
        console.log(task.attrs, 'fail')
        callback();
      });
  }, defaultWorkerCount);

  queue.pause(); //Initialize the controller with synchronization paused (so we dont sync in light mode)

  /**
   * @ngdoc method
   * @name start
   * @methodOf neo.blockchain.sync
   * @description
   * Starts the synchronization activity.
   */
  module.start = function(){
    if (module.runLock) return false; //prevent the overlapping runs
    module.runLock = true;

    getBlockWritePointer()
      .then(function (res) {
        //If  the are new blocks on the chain and the queue is empty
        //add the next block.
        if ((res < blockchain.highestNode().blockHeight) &&
        (queue.length() == 0)) {
          module.enqueueBlock(res + 1, true);
        }
          queue.resume();
        })
      .catch(function () {
        console.log("Could not get local block height.")
      })
  };

  /**
  * @ngdoc method
  * @name stop
  * @methodOf neo.blockchain.sync
  * @description
  * Stops the synchronization activity.
  */
  module.stop = function(){
    module.runLock = false;
    queue.pause();
  };

  /**
   * @ngdoc method
   * @name setWorkers
   * @methodOf neo.blockchain.sync
   * @description
   * Update the number of workers in the sync activity.
   * @param {Number} count The number of workers to use.
   */
  module.setWorkers = function(count){
    queue.concurrency = count;
  };

  /**
   * @ngdoc method
   * @name storeBlock
   * @methodOf neo.blockchain.sync
   * @description
   * Uses the RPC controller to get a the requested block
   * and inserts it into the local database.
   * @param {Object} attrs The block attributes
   */
  module.storeBlock = function(attrs){
    return new Promise(function(resolve, reject) {
      //get the block using the rpc controller
      blockchain.rpc.getBlock(attrs.index)
        .then(function (res) {
          //inject the block into the database and save.
          var block = blockchain.db.blocks(res);
          block.save(function (err) {
            if (err) return reject(err);
            resolve();
          })
        })
        .catch(function(err){
          reject(err);
        })
    });
  };

 /**
  * @ngdoc method
  * @name enqueueBlock
  * @methodOf neo.blockchain.sync
  * @description
  * Adds a block request to the sync queue.
  * @param {Number} index The index of the block to synchronize.
  * @param {Boolean} [safe] Insert if the queue is not empty?
  */
  module.enqueueBlock = function(index, safe = false){
    if (safe && (queue.length() > 0)) return;

    //if the blockheight is above the current height,
    //increment the write pointer.
    if (index > blockchain.blockWritePointer) {
      blockchain.blockWritePointer = index;
    }
    //enqueue the block.
    queue.push({
      method: module.storeBlock,
      attrs: {
        index: index,
        max: blockchain.highestNode().blockHeight,
        percent: (index) / blockchain.highestNode().blockHeight * 100
      }
    })
  }

  /**
   * @private
   * @ngdoc method
   * @name getBlockWritePointer
   * @methodOf neo.blockchain.sync
   * @description
   * Pulls the block write pointer out of the local database.
   */
  var getBlockWritePointer = function(){
    return new Promise(function(resolve, reject){
      blockchain.db.blocks.findOne({}, 'index')
        .sort('-index')
        .exec(function (err, res) {
          if (err) return reject(err);
          if (!res) res = {'index': -1};
          blockchain.blockWritePointer = res.index;
          resolve(res.index);
        })
    })
  }

  return module
};
