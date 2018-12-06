import { rpc } from '@cityofzion/neon-js'
import { RpcValidator } from '../validators/rpc-validator'
import { AxiosRequestConfig } from 'axios'

export class RpcDelegate {
  static async query(url: string, method: string, params: any[], id: number, requestConfig: AxiosRequestConfig): Promise<object> {
    RpcValidator.validateUrl(url)
    RpcValidator.validateMethod(method)
    RpcValidator.validateId(id)

    const q = new rpc.Query({ method, params, id })
    return await q.execute(url, requestConfig)
  }
}
