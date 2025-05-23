import { Document, Model, Types } from "mongoose";
import { IUserActivity } from "../../shared/interface/UserActivityInterface";
interface IUserActivityDocument extends Omit<IUserActivity, "_id" | "sessionId" | "userId">, Document {
    sessionId: Types.ObjectId;
    userId: Types.ObjectId;
}
export declare const UserActivityModel: Model<IUserActivityDocument>;
export {};
//# sourceMappingURL=UserActivityModel.d.ts.map