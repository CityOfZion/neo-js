import { isArray } from 'lodash'

export class BlockHelper {
  static getGenerationTime(block: any, previousBlockTimestamp: number | undefined): number {
    return (previousBlockTimestamp) ? block.time - previousBlockTimestamp : 0
  }

  static getTransactionCount(block: any): number {
    if (block && block.tx && isArray(block.tx)) {
      return block.tx.length
    }
    return 0
  }
}
