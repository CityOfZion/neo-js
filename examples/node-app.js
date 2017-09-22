#!/usr/bin/env node

const Profiles  = require('./profiles');
const neo = require('../dist/neo.blockchain.neo').neo;
const neoBlockchain = new neo('light', 'mainnet');
const neoNode = neoBlockchain.fastestNode();
// const newNode = neoBlockchain.nodeWithBlock(1, 'latency', false);

// Use Cases

const getBalanceDemo = function () {
  console.log('getBalanceDemo:');
  const assetId = Profiles.Assets.NEO;
  return new Promise((resolve) => {
    neoNode.getBalance(assetId)
      .then(function (res) {
        console.log('resolved:');
        console.log(res.data);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getBestBlockHashDemo = function () {
  console.log('getBestBlockHashDemo:');
  return new Promise((resolve) => {
    neoNode.getBestBlockHash()
      .then(function (res) {
        console.log(res);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getBlockDemo = function () {
  console.log('getBlockDemo:');
  const blockNumber = 10000;
  return new Promise((resolve) => {
    neoNode.getBlock(blockNumber)
      .then(function (res) {
        console.log(res);
        var hash = res.hash;
        console.log('hash:', hash);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getBlockCountDemo = function () {
  console.log('getBlockCountDemo:');
  return new Promise((resolve) => {
    neoNode.getBlockCount()
      .then(function (res) {
        console.log(res);
        // console.log(res.data.result);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getBlockHashDemo = function () {
  console.log('getBlockHashDemo:');
  return new Promise((resolve) => {
    neoNode.getBlockHash(10000)
      .then(function (res) {
        console.log(res);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getConnectionCountDemo = function () {
  console.log('getConnectionCountDemo:');
  return new Promise((resolve) => {
    neoNode.getConnectionCount()
      .then(function (res) {
        console.log(res);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getRawMemPoolDemo = function () {
  console.log('getRawMemPoolDemo:');
  return new Promise((resolve) => {
    neoNode.getRawMemPool()
      .then(function (res) {
        console.log(res);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getRawTransactionDemo = function () {
  console.log('getRawTransactionDemo:');
  const txId = '0x9c909e1e3ba03290553a68d862e002c7a21ba302e043fc492fe069bf6a134d29'; // TX for block #10000
  return new Promise((resolve) => {
    neoNode.getRawTransaction(txId)
      .then(function (res) {
        console.log(res);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

const getTXOutDemo = function () {
  console.log('getTXOutDemo:');
  const txId = '0x9c909e1e3ba03290553a68d862e002c7a21ba302e043fc492fe069bf6a134d29'; // TX for block #10000
  return new Promise((resolve) => {
    neoNode.getTXOut(txId)
      .then(function (res) {
        console.log(res);
        resolve();
      })
      .catch(function (err) {
        console.log('error:');
        console.log(err);
        resolve();
      });
  });
};

// Chain of command

async function actionAsync() {
  console.log(`Connected node: ${neoNode.domain}:${neoNode.port}`);
  console.log();  

  // await getBalanceDemo(); // Not working. Pressume local blockchain is required.
  await getBestBlockHashDemo();
  await getBlockDemo();
  await getBlockCountDemo();
  await getBlockHashDemo();
  await getConnectionCountDemo();
  await getRawMemPoolDemo();
  await getRawTransactionDemo();
  // await getTXOutDemo(); // Not working. Error response with 'Index was out of range'.
  //TODO: sendRawTransaction
  //TODO: sendToAddress
  //TODO: submitBlock
  
  process.exit();
};

// Execute

actionAsync();
