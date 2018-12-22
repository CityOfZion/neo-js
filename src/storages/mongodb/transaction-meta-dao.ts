import { Mongoose } from 'mongoose'
import { transactionMetaSchema } from './schemas'

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

  private getModel(mongoose: Mongoose, collectionName: string) {
    const schema = transactionMetaSchema
    return mongoose.models[collectionName] || mongoose.model(collectionName, schema)
  }
}
