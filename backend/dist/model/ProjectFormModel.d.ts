import { Document, Types } from "mongoose";
import { IProjectForm } from "../../shared/interface/ProjectFormInterface";
export interface IProjectFormDocument extends Omit<IProjectForm, "user">, Document {
    user: Types.ObjectId;
}
declare const _default: import("mongoose").Model<IProjectFormDocument, {}, {}, {}, Document<unknown, {}, IProjectFormDocument> & IProjectFormDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ProjectFormModel.d.ts.map