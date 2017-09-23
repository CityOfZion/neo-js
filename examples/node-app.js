#!/usr/bin/env node

const Profiles  = require('./profiles');
const neo = require('../dist/neo.blockchain.neo').neo;
const neoBlockchain = new neo('light', 'testnet');
const neoNode = neoBlockchain.fastestNode();
// const newNode = neoBlockchain.nodeWithBlock(1, 'latency', false);

// Use Cases

const getBalanceDemo = async function () {
  console.log('getBalanceDemo:');
  try {
    const res = await neoNode.getBalance(Profiles.Assets.NEO);
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
};

const getBestBlockHashDemo = async function () {
  console.log('getBestBlockHashDemo:');
  try {
    const res = await neoNode.getBestBlockHash();
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
};

const getBlockDemo = async function () {
  console.log('getBlockDemo:');
  const blockNumber = 10000;  
  try {
    const res = await neoNode.getBlock();
    // console.log(res);
    var hash = res.hash;
    console.log('hash:', hash);
  } catch (err) {
    console.log('error:', err);
  }
};

const getBlockCountDemo = async function () {
  console.log('getBlockCountDemo:');
  try {
    const res = await neoNode.getBlockCount();
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
};

const getBlockHashDemo = async function () {
  console.log('getBlockHashDemo:');
  try {
    const res = await neoNode.getBlockHash(10000);
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
};

const getConnectionCountDemo = async function () {
  console.log('getConnectionCountDemo:');
  try {
    const res = await neoNode.getConnectionCount();
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
};

const getRawMemPoolDemo = async function () {
  console.log('getRawMemPoolDemo:');
  try {
    const res = await neoNode.getRawMemPool();
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
};

const getRawTransactionDemo = async function () {
  console.log('getRawTransactionDemo:');
  const txId = '0x9c909e1e3ba03290553a68d862e002c7a21ba302e043fc492fe069bf6a134d29'; // TX for block #10000
  try {
    const res = await neoNode.getRawTransaction(txId);
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
};

const getTXOutDemo = async function () {
  console.log('getTXOutDemo:');
  const txId = '0x9c909e1e3ba03290553a68d862e002c7a21ba302e043fc492fe069bf6a134d29'; // TX for block #10000
  try {
    const res = await neoNode.getTXOut(txId);
    console.log(res);
  } catch (err) {
    console.log('error:', err);
  }
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
