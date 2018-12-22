import { Mongoose } from 'mongoose';
export declare class TransactionMetaDao {
    private model;
    constructor(mongoose: Mongoose, collectionName: string);
    count(): Promise<number>;
    save(data: object): Promise<void>;
    private getModel;
}
