export class EndpointValidator {
  static validateArray(endpoints: object[]) {
    if (endpoints.length <= 0) {
      throw new Error(`'endpoints' must be an non empty array.`)
    }
    endpoints.forEach((ep: any) => {
      if (!ep.endpoint) {
        throw new Error(`item of 'endpoints' contain 'endpoint' property.`)
      }
    })
  }
}
