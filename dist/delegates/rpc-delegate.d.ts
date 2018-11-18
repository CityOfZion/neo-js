import { AxiosRequestConfig } from 'axios';
export declare class RpcDelegate {
    static query(url: string, method: string, params: any[], id: number, requestConfig: AxiosRequestConfig): Promise<object>;
}
