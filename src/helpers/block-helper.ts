import { isArray } from 'lodash'

export class BlockHelper {
  static getGenerationTime(block: object, previousBlock: object | undefined): number {
    if (previousBlock && (previousBlock as any).time) {
      return (block as any).time - (previousBlock as any).time
    } else {
      return 0
    }
  }

  static getTransactionCount(block: any): number {
    if (block && block.tx && isArray(block.tx)) {
      return block.tx.length
    }
    return 0
  }
}
