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

  async countByBelowApiLevel(apiLevel: number): Promise<number> {
    return await this.model
      .countDocuments({
        apiLevel: { $lt: apiLevel },
      })
      .exec()
  }

  async removeByBelowApiLevel(apiLevel: number): Promise<void> {
    return await this.model
      .deleteMany({
        apiLevel: { $lt: apiLevel },
      })
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
