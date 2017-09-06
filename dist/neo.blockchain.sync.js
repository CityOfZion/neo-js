module.exports = function(blockchain){
  var module = {};

  var async = require('async');
  var runLock = false;
  var workerCount = 10;
  var maxQueueLength = 1000;

  var queue = async.queue(function(task, callback) {
    task.method(task.attrs)
      .then(function(){
        console.log(task.attrs);
        callback();
      });
  }, workerCount);

  queue.empty = function(){
    module.checkBlocks();
  };
  queue.pause();

  module.start = function(){
    queue.resume();
  };

  module.stop = function(){
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

  module.checkBlocks = function(){
    return new Promise(function(resolve, reject) {
      var nextBlock = 0;
      var remoteHeight = 0;
      var addNumber = 0;

      blockchain.db.blocks.findOne({}, 'index')
        .sort('-index')
        .exec(function (err, res) {
          if (!res) res = {'index': -1};
          remoteHeight = blockchain.highestNode().blockHeight;
          nextBlock = res.index + 1;

          if (nextBlock <= remoteHeight) {
            addNumber = Math.min(maxQueueLength - queue.length(), remoteHeight - (nextBlock - 1));
            for (var i = 0; i < addNumber; i++) {
              queue.push({
                method: module.storeBlock,
                attrs: {
                  index: nextBlock + i,
                  max: remoteHeight,
                  percent: (nextBlock + i)/remoteHeight * 100
                }
              }, function () {
              });
            }
          }
          resolve();
        });
    })
  };
  module.checkBlocks();
  setInterval(function() {
    if (queue.length() == 0) module.checkBlocks();
  }, 10000);

  return module
};
