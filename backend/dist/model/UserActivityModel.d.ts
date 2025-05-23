import { Document, Model, Types } from "mongoose";
import { IUserActivity } from "../../shared/interface/UserActivityInterface";
export interface IUserActivityDocument extends Omit<IUserActivity, "_id" | "sessionId" | "userId">, Document {
    sessionId: Types.ObjectId;
    userId: Types.ObjectId;
}
export declare const UserActivityModel: Model<IUserActivityDocument>;
//# sourceMappingURL=UserActivityModel.d.ts.map