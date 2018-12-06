import { includes } from 'lodash'

export class MongodbUtils {
  static async reviewIndex(model: any, key: string, keyObj: object): Promise<void> {
    const hasRequiredIndex = await MongodbUtils.hasIndex(model, key)
    if (hasRequiredIndex) {
      return
    }
    await MongodbUtils.createIndex(model, keyObj)
  }

  static async hasIndex(model: any, key: string): Promise<boolean> {
    const indexes = await model.collection.getIndexes()
    const keys = Object.keys(indexes)
    const canFindIndex = includes(keys, key)
    return canFindIndex
  }

  static async createIndex(model: any, keyObj: object): Promise<void> {
    await model.collection.createIndex(keyObj)
  }
}
