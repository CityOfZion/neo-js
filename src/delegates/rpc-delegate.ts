import { rpc } from '@cityofzion/neon-js'
import { RpcValidator } from '../validators/rpc-validator'

export class RpcDelegate {
  static query(url: string, method: string, params: any[], id: number): Promise<object> {
    RpcValidator.validateUrl(url)
    RpcValidator.validateMethod(method)
    RpcValidator.validateId(id)

    const q = new rpc.Query({ method, params, id })
    return q.execute(url)
  }
}
