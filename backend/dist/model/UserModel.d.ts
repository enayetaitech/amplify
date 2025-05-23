import { Document, Model } from "mongoose";
import { IUser } from "../../shared/interface/UserInterface";
export interface IUserDocument extends Omit<IUser, "_id">, Document {
}
declare const User: Model<IUserDocument>;
export default User;
//# sourceMappingURL=UserModel.d.ts.map