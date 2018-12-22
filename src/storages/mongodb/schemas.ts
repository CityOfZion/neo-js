import { Schema } from 'mongoose'

export const blockSchema = new Schema(
  {
    height: Number,
    createdBy: String,
    source: String,
    userAgent: String,
    payload: {
      hash: String,
      size: Number,
      version: Number,
      previousblockhash: String,
      merkleroot: String,
      time: Number,
      index: { type: 'Number', required: true },
      nonce: String,
      nextconsensus: String,
      script: {
        invocation: String,
        verification: String,
      },
      tx: [],
      confirmations: Number,
      nextblockhash: String,
    },
  },
  { timestamps: true }
)

export const blockMetaSchema = new Schema(
  {
    height: { type: 'Number', unique: true, required: true, dropDups: true },
    time: Number,
    size: Number,
    generationTime: Number,
    transactionCount: Number,
    createdBy: String,
    apiLevel: Number,
  },
  { timestamps: true }
)

export const transactionMetaSchema = new Schema(
  {
    height: Number,
    time: Number,
    txid: { type: 'String', unique: true, required: true, dropDups: true },
    type: String,
    createdBy: String,
    apiLevel: Number,
  },
  { timestamps: true }
)
