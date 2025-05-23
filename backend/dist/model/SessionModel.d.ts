import { Document, Types } from "mongoose";
import { ISession } from "../../shared/interface/SessionInterface";
type SessionDB = Omit<ISession, "_id" | "projectId" | "moderators"> & {
    projectId: Types.ObjectId;
    moderators: Types.ObjectId[];
};
export interface ISessionDocument extends Document<Types.ObjectId, {}, SessionDB>, SessionDB {
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const SessionModel: import("mongoose").Model<ISessionDocument, {}, {}, {}, Document<unknown, {}, ISessionDocument> & ISessionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=SessionModel.d.ts.map