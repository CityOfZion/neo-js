import { includes } from 'lodash'

export class MongodbUtils {
  static reviewIndex(model: any, key: string, keyObj: object): Promise<void> {

    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => MongodbUtils.hasIndex(model, key))
        .then((hasRequiredIndex: boolean) => {
          if (hasRequiredIndex) {
            // Determined that there's no need to create index
            throw new Error('SKIP_INDEX')
          }
          return Promise.resolve()
        })
        .then(() => MongodbUtils.createIndex(model, keyObj))
        .then(() => {
          return resolve()
        })
        .catch((err: any) => {
          if (err.message === 'SKIP_INDEX') {
            return resolve()
          } else {
            return reject(err)
          }
        })
    })
  }

  static hasIndex(model: any, key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      model.collection
        .getIndexes()
        .then((res: any) => {
          const keys = Object.keys(res)
          const result = includes(keys, key)
          return resolve(result)
        })
        .catch((err: any) => reject(err))
    })
  }

  static createIndex(model: any, keyObj: object): Promise<void> {
    return new Promise((resolve, reject) => {
      model.collection
        .createIndex(keyObj)
        .then((res: any) => resolve())
        .catch((err: any) => reject(err))
    })
  }
}
