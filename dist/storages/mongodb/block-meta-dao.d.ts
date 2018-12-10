import { Mongoose } from 'mongoose';
export declare class BlockMetaDao {
    private model;
    constructor(mongoose: Mongoose, collectionName: string);
    count(): Promise<number>;
    getHighest(): Promise<object | undefined>;
    getHighestHeight(): Promise<number>;
    save(data: object): Promise<void>;
    removeByHeight(height: number): Promise<void>;
    analyze(startHeight: number, endHeight: number): Promise<object[]>;
    private getModel;
}
