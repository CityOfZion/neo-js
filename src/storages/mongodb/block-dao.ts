import { Mongoose } from 'mongoose'
import { blockSchema } from './schemas'
import { MongodbUtils } from './utils'

export class BlockDao {
  private model: any

  constructor(mongoose: Mongoose, collectionName: string) {
    this.model = this.getModel(mongoose, collectionName)
  }

  async countByHeight(height: number): Promise<number> {
    return await this.model.countDocuments({ height }).exec()
  }

  async getHighestHeight(): Promise<number> {
    return await this.model
      .findOne({}, 'height')
      .sort({ height: -1 })
      .exec()
  }

  async getByHeight(height: number): Promise<any> {
    /**
     * NOTE:
     * It is assumed that there may be multiple matches and will pick 'latest created' one as truth.
     */
    return await this.model
      .findOne({ height })
      .sort({ createdAt: -1 })
      .exec()
  }

  async listByHeight(height: number): Promise<object[]> {
    const result = await this.model
      .find({ height })
      .sort({ createdAt: -1 })
      .exec()
    if (!result) {
      return []
    }
    // TODO: Verify if res is array
    return result
  }

  async getByTransactionId(transactionId: string): Promise<object | undefined> {
    return await this.model
      .findOne({
        'payload.tx': {
          $elemMatch: {
            txid: transactionId,
          },
        },
      })
      .exec()
  }

  async save(data: object): Promise<void> {
    await this.model(data).save()
  }

  async removeById(id: string): Promise<void> {
    await this.model.remove({ _id: id }).exec()
  }

  async analyze(startHeight: number, endHeight: number): Promise<object[]> {
    /**
     * Example result:
     * [
     *   { _id: 1, count: 1 },
     *   { _id: 2, count: 4 },
     *   ...
     * ]
     */
    const aggregatorOptions = [
      {
        $group: {
          _id: '$height',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: {
            // This '_id' is now referring to $height as designated in $group
            $gte: startHeight,
            $lte: endHeight,
          },
        },
      },
    ]
    return await this.model
      .aggregate(aggregatorOptions)
      .allowDiskUse(true)
      .exec()
  }

  async reviewIndex(key: string, keyObj: object): Promise<void> {
    return await MongodbUtils.reviewIndex(this.model, key, keyObj)
  }

  private getModel(mongoose: Mongoose, collectionName: string) {
    const schema = blockSchema
    return mongoose.models[collectionName] || mongoose.model(collectionName, schema)
  }
}
