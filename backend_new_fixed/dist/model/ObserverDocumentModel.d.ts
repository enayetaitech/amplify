import { Types, Document } from "mongoose";
import { IObserverDocument } from "../../shared/interface/ObserverDocumentInterface";
type ObserverDocDB = Omit<IObserverDocument, "_id" | "projectId" | "sessionId" | "addedBy"> & {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
    sessionId: Types.ObjectId;
    addedBy: Types.ObjectId;
};
export interface ObserverDocument extends Document<Types.ObjectId, {}, ObserverDocDB>, ObserverDocDB {
}
export declare const ObserverDocumentModel: import("mongoose").Model<ObserverDocument, {}, {}, {}, Document<unknown, {}, ObserverDocument> & ObserverDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=ObserverDocumentModel.d.ts.map