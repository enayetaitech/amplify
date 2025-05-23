import { Document, Types } from "mongoose";
import { IModerator } from "../../shared/interface/ModeratorInterface";
export interface IModeratorDocument extends Omit<IModerator, "_id" | "projectId">, Document {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
}
declare const _default: import("mongoose").Model<IModeratorDocument, {}, {}, {}, Document<unknown, {}, IModeratorDocument> & IModeratorDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ModeratorModel.d.ts.map