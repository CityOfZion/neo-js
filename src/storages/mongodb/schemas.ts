import { Schema } from 'mongoose'

export const BlockSchema = new Schema(
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

export const BlockMetaSchema = new Schema(
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
