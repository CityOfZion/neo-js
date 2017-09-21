#!/usr/bin/env node

const Profiles  = require('./profiles');
const neo = require('../dist/neo.blockchain.neo').neo;
const neoBlockchain = new neo('light', 'mainnet');
const neoNode = neoBlockchain.fastestNode();

// Use Cases

const getBalance = function () {
  console.log('getBalance:');
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

const getBlockCount = function () {
  console.log('getBlockCount:');
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

const getBlock = function () {
  console.log('getBlock:');
  const blockNumber = 10000;
  return new Promise((resolve) => {
    neoNode.getBlock(10000)
      .then(function (res) {
        // console.log(res);
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

// Chain of command

async function actionAsync() {
  console.log('== Block Demo ==');
  // await getBalance(); // Not working. Assume local blockchain is required.
  await getBlockCount();
  await getBlock();
  console.log();

  process.exit();
};

// Execute

actionAsync();
