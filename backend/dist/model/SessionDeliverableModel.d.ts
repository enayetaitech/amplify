import { Types, Document } from "mongoose";
import { ISessionDeliverable } from "../../shared/interface/SessionDeliverableInterface";
type DeliverableDB = Omit<ISessionDeliverable, "_id" | "sessionId" | "projectId" | "uploadedBy"> & {
    _id: Types.ObjectId;
    sessionId: Types.ObjectId;
    projectId: Types.ObjectId;
    uploadedBy: Types.ObjectId;
};
export interface SessionDeliverableDocument extends Document<Types.ObjectId, {}, DeliverableDB>, DeliverableDB {
}
export declare const SessionDeliverableModel: import("mongoose").Model<SessionDeliverableDocument, {}, {}, {}, Document<unknown, {}, SessionDeliverableDocument> & SessionDeliverableDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=SessionDeliverableModel.d.ts.map