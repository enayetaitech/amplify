import { Types, Document } from "mongoose";
import { ITag } from "../../shared/interface/TagInterface";
/**
 * Convert the three IDs from `string` to `Types.ObjectId`
 * so they line up with what Mongoose actually stores.
 */
type TagDBProps = Omit<ITag, "_id" | "createdBy" | "projectId"> & {
    createdBy: Types.ObjectId;
    projectId: Types.ObjectId;
};
/**
 * Mongoose document type = your converted props + the built-in Document
 * + automatic timestamp fields.
 */
export interface TagDocument extends Document<Types.ObjectId, {}, TagDBProps>, TagDBProps {
    createdAt: Date;
    updatedAt: Date;
}
export declare const TagModel: import("mongoose").Model<TagDocument, {}, {}, {}, Document<unknown, {}, TagDocument> & TagDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=TagModel.d.ts.map