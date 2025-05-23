import { Document, Types } from "mongoose";
import { IProject, IProjectSession } from "../../shared/interface/ProjectInterface";
export interface IProjectDocument extends Omit<IProject, "createdBy" | "tags" | "moderators" | "meetings" | "_id">, Document {
    createdBy: Types.ObjectId;
    tags: Types.ObjectId[];
    moderators: Types.ObjectId[];
    meetings: Types.ObjectId[];
    sessions: IProjectSession[];
}
declare const _default: import("mongoose").Model<IProjectDocument, {}, {}, {}, Document<unknown, {}, IProjectDocument> & IProjectDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ProjectModel.d.ts.map