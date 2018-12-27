import { Mongoose } from 'mongoose';
export declare class TransactionMetaDao {
    private model;
    constructor(mongoose: Mongoose, collectionName: string);
    count(): Promise<number>;
    save(data: object): Promise<void>;
    removeByBelowApiLevel(apiLevel: number): Promise<void>;
    analyze(startHeight: number, endHeight: number): Promise<object[]>;
    reviewIndex(key: string, keyObj: object): Promise<void>;
    private getModel;
}
