import { Mongoose } from 'mongoose'
import { transactionMetaSchema } from './schemas'
import { MongodbUtils } from './utils'

export class TransactionMetaDao {
  private model: any

  constructor(mongoose: Mongoose, collectionName: string) {
    this.model = this.getModel(mongoose, collectionName)
  }

  async count(): Promise<number> {
    return await this.model.countDocuments({}).exec()
  }

  async save(data: object): Promise<void> {
    return await this.model(data).save()
  }

  async removeByBelowApiLevel(apiLevel: number): Promise<void> {
    return await this.model
      .deleteMany({
        apiLevel: { $lt: apiLevel },
      })
      .exec()
  }

  async analyze(startHeight: number, endHeight: number): Promise<object[]> {
    /**
     * Example Result:
     * [
     *  { _id: 5bff81ccbbd4fc5d6f3352d5, height: 95, apiLevel: 1 },
     *  { _id: 5bff81ccbbd4fc5d6f3352d9, height: 96, apiLevel: 1 },
     *  ...
     * ]
     */
    return await this.model
      .find(
        {
          height: {
            $gte: startHeight,
            $lte: endHeight,
          },
        },
        'height apiLevel'
      )
      .exec()
  }

  async reviewIndex(key: string, keyObj: object): Promise<void> {
    return await MongodbUtils.reviewIndex(this.model, key, keyObj)
  }

  private getModel(mongoose: Mongoose, collectionName: string) {
    const schema = transactionMetaSchema
    return mongoose.models[collectionName] || mongoose.model(collectionName, schema)
  }
}
