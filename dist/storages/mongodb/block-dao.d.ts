import { Mongoose } from 'mongoose';
export declare class BlockDao {
    private model;
    constructor(mongoose: Mongoose, collectionName: string);
    countByHeight(height: number): Promise<number>;
    getHighestHeight(): Promise<number>;
    getByHeight(height: number): Promise<any>;
    listByHeight(height: number): Promise<object[]>;
    getByTransactionId(transactionId: string): Promise<object | undefined>;
    save(data: object): Promise<void>;
    deleteManyById(id: string): Promise<void>;
    analyze(startHeight: number, endHeight: number): Promise<object[]>;
    reviewIndex(key: string, keyObj: object): Promise<void>;
    private getModel;
}
