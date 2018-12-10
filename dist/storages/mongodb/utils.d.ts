export declare class MongodbUtils {
    static reviewIndex(model: any, key: string, keyObj: object): Promise<void>;
    static hasIndex(model: any, key: string): Promise<boolean>;
    static createIndex(model: any, keyObj: object): Promise<void>;
}
