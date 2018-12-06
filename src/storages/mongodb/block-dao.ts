import { Mongoose } from 'mongoose'
import { blockSchema } from './schemas'
import { MongodbUtils } from './utils'

export class BlockDao {
  private model: any

  constructor(mongoose: Mongoose, collectionName: string) {
    this.model = this.getModel(mongoose, collectionName)
  }

  countByHeight(height: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model.countDocuments({ height }).exec((err: any, res: number) => {
        if (err) {
          return reject(err)
        }
        return resolve(res)
      })
    })
  }

  getHighestHeight(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model
        .findOne({}, 'height')
        .sort({ height: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            return reject(err)
          }
          if (!res) {
            return resolve(0)
          }
          return resolve(res.height)
        })
    })
  }

  getByHeight(height: number): Promise<any> {
    /**
     * NOTE:
     * It is assumed that there may be multiple matches and will pick 'latest created' one as truth.
     */
    return new Promise((resolve, reject) => {
      this.model
        .findOne({ height })
        .sort({ createdAt: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            return reject(err)
          }
          return resolve(res)
        })
    })
  }

  listByHeight(height: number): Promise<object[]> {
    return new Promise((resolve, reject) => {
      this.model
        .find({ height })
        .sort({ createdAt: -1 })
        .exec((err: any, res: any) => {
          if (err) {
            return reject(err)
          }
          if (!res) {
            return resolve([])
          }
          // TODO: Verify if res is array
          return resolve(res)
        })
    })
  }

  getByTransactionId(transactionId: string): Promise<object | undefined> {
    return new Promise((resolve, reject) => {
      this.model
        .findOne({
          'payload.tx': {
            $elemMatch: {
              txid: transactionId,
            },
          },
        })
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

  removeById(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.model.remove({ _id: id }).exec((err: any, res: any) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }

  analyze(startHeight: number, endHeight: number): Promise<object[]> {
    /**
     * Example result:
     * [
     *   { _id: 1, count: 1 },
     *   { _id: 2, count: 4 },
     *   ...
     * ]
     */
    return new Promise((resolve, reject) => {
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

      this.model
        .aggregate(aggregatorOptions)
        .allowDiskUse(true)
        .exec((err: Error, res: any) => {
          if (err) {
            return reject(err)
          }
          return resolve(res)
        })
    })
  }

  async reviewIndex(key: string, keyObj: object): Promise<void> {
    return await MongodbUtils.reviewIndex(this.model, key, keyObj)
  }

  private getModel(mongoose: Mongoose, collectionName: string) {
    const schema = blockSchema
    return mongoose.models[collectionName] || mongoose.model(collectionName, schema)
  }
}
