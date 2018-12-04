import { Mongoose } from 'mongoose'
import { BlockMetaSchema } from './schemas'

export class BlockMetaDao {
  private model: any

  constructor(mongoose: Mongoose, collectionName: string) {
    this.model = this.getModel(mongoose, collectionName)
  }

  count(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model.count({}).exec((err: any, res: any) => {
        if (err) {
          return reject(err)
        }
        return resolve(res)
      })
    })
  }

  getHighest(): Promise<object | undefined> {
    return new Promise((resolve, reject) => {
      this.model
        .findOne()
        .sort({ height: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            return reject(err)
          }
          return resolve(res)
        })
    })
  }

  save(data: object): Promise<void> {
    return new Promise((resolve, reject) => {
      this.model(data).save((err: any) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  removeByHeight(height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.model.remove({ height }).exec((err: any, res: any) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }

  analyze(startHeight: number, endHeight: number): Promise<object[]> {
    /**
     * Example Result:
     * [
     *  { _id: 5bff81ccbbd4fc5d6f3352d5, height: 95, apiLevel: 1 },
     *  { _id: 5bff81ccbbd4fc5d6f3352d9, height: 96, apiLevel: 1 },
     *  ...
     * ]
     */
    return new Promise((resolve, reject) => {
      this.model
        .find(
          {
            height: {
              $gte: startHeight,
              $lte: endHeight,
            },
          },
          'height apiLevel'
        )
        .exec((err: any, res: any) => {
          if (err) {
            return reject(err)
          }
          return resolve(res)
        })
    })
  }

  private getModel(mongoose: Mongoose, collectionName: string) {
    const schema = BlockMetaSchema
    return mongoose.models[collectionName] || mongoose.model(collectionName, schema)
  }
}
