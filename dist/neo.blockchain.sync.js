module.exports = function(blockchain){
  var module = {};

  var async = require('async');
  module.runLock = false;
  var defaultWorkerCount = 10;
  var maxQueueLength = 10000;
  var t0 = Date.now();
  this.startblock = 0;

  var queue = async.queue(function(task, callback) {
    task.method(task.attrs)
      .then(function() {
        while((queue.length() < maxQueueLength) &&
        (blockchain.blockWritePointer < blockchain.highestNode().blockHeight)){
          module.enqueueBlock(blockchain.blockWritePointer + 1);
        }
        if ((task.attrs.index - this.startblock) % 1000 == 0){
          console.log(task.attrs);
        }
        callback();
      })
      .catch(function(err){
        module.enqueueBlock(task.attrs.index);
        console.log(task.attrs, 'fail')
        callback();
      });
  }, defaultWorkerCount);

  queue.pause();

  module.start = function(){
    if (module.runLock) return false;
    module.runLock = true;

    getBlockWritePointer()
      .then(function (res) {
        this.startblock = res;
        if (res < blockchain.highestNode().blockHeight) {
          module.enqueueBlock(res + 1, true);
          queue.resume();
        }
      })
      .catch(function () {
        console.log("Could not get local block height.")
      })
  };


  module.stop = function(){
    module.runLock = false;
    queue.pause();
  };

  module.setWorkers = function(count){
    queue.concurrency = count;
  };

  module.storeBlock = function(attrs){
    return new Promise(function(resolve, reject) {
      blockchain.rpc.getBlock(attrs.index)
        .then(function (res) {
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


  module.enqueueBlock = function(index, safe = false){
    if (safe && (queue.length() > 0)) return;

    if (index > blockchain.blockWritePointer) {
      blockchain.blockWritePointer = index;
    }
    queue.push({
      method: module.storeBlock,
      attrs: {
        index: index,
        max: blockchain.highestNode().blockHeight,
        percent: (index) / blockchain.highestNode().blockHeight * 100
      }
    })
  }

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
