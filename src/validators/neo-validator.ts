export class NeoValidator {
  static validateHeight(height: number) {
    if (height <= 0) {
      throw new Error(`'height' must be an integer 1 or above.`)
    }
  }

  static validateTransactionId(transactionId: string) {
    // TODO
  }
}
