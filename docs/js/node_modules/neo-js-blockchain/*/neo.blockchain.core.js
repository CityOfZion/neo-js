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
  var blockWritePointer = -1;

  var defaultWorkerCount = 20; //The number of blocks to grab in parallel.
  var maxQueueLength = 10000; //maximum supported working queue length. Helps with memory usage during large syncs.
  var logPeriod = 10000; //log sync status every n blocks.
  var stats = {};
  var t0 = Date.now();
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
  var queue = async.priorityQueue(function(task, callback) {
    task.method(task.attrs)
      .then(function() {
        //after a sync even is run, enqueue any other
        // outstanding blocks up to the max queue length.

        while((queue.length() < maxQueueLength) &&
        (blockWritePointer < blockchain.highestNode().index)){
          module.enqueueBlock(blockWritePointer + 1);
        }
        //Consider logging a status update...communication is important
        if ((task.attrs.index % logPeriod == 0) ||
        (task.attrs.index == blockchain.highestNode().index)){
          console.log(task.attrs, logPeriod/((Date.now() - t0) / 1000)  );
          if ((task.attrs.index == blockchain.highestNode().index)){ console.log(stats)};
          t0 = Date.now();
        }
        callback();
      })
      .catch(function(err){
        //If the blcok request fails, throw it to the back to the queue to try again.
        //timout prevents inf looping on connections issues etc..
        console.log(task.attrs, 'fail')
        setTimeout(function() {
            module.enqueueBlock(task.attrs.index, 0);
          }, 2000)
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

    console.log('Synchronizing');
    module.clock = setInterval(function(){
      if (module.runLock){
        if ((blockchain.localNode.index < blockchain.highestNode().index) &&
          (queue.length() == 0)) {
          blockWritePointer = blockchain.localNode.index;
          console.log(blockWritePointer);
          module.enqueueBlock(blockWritePointer + 1, true);
        }
      }
      else clearInterval(module.clock);
    }, 2000)


    module.clock2 = setInterval(function(){
      if (module.runLock){
        blockchain.localNode.verifyBlocks()
          .then(function(res){
            res.forEach(function(r){
              module.enqueueBlock(r, 0);
            })
          });
      }
      else clearInterval(module.clock);
    }, 60000)

    queue.resume();
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
      var node = blockchain.nodeWithBlock(attrs.index, 'pendingRequests', false)
      if (!stats[node.domain]) stats[node.domain] = {'s': 0, 'f1': 0, 'f2': 0};

        node.getBlock(attrs.index)
        .then(function (res) {
          //inject the block into the database and save.
          blockchain.localNode.saveBlock(res)
            .then(function(){
              stats[node.domain]['s']++;
              resolve();
            })
            .catch(function(err){
              stats[node.domain]['f2']++;
              resolve();
            })
        })
        .catch(function(err){
          stats[node.domain]['f1']++;
          return reject(err);
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
  module.enqueueBlock = function(index, priority=5, safe = false){
    if (safe && (queue.length() > 0)) return;
    //if the blockheight is above the current height,
    //increment the write pointer.
    if (index > blockWritePointer) {
      blockWritePointer = index;
    }
    //enqueue the block.
    queue.push({
      method: module.storeBlock,
      attrs: {
        index: index,
        max: blockchain.highestNode().index,
        percent: (index) / blockchain.highestNode().index * 100
      }
    }, 5)
  }


  return module
};
