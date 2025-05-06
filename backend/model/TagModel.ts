import { Schema, model, Types, Document } from "mongoose";
import { ITag } from "../../shared/interface/TagInterface"; 
/**
 * Convert the three IDs from `string` to `Types.ObjectId`
 * so they line up with what Mongoose actually stores.
 */
type TagDBProps = Omit<ITag, "_id" | "createdBy" | "projectId"> & {
  _id: Types.ObjectId;
  createdBy: Types.ObjectId;
  projectId: Types.ObjectId;
};

/**
 * Mongoose document type = your converted props + the built-in Document
 * + automatic timestamp fields.
 */
export interface TagDocument
  extends Document<Types.ObjectId, {}, TagDBProps>,
    TagDBProps {
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<TagDocument>(
  {
    title:     { type: String, required: true, trim: true },
    color:     { type: String, required: true, trim: true },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  { timestamps: true }
);

export const TagModel = model<TagDocument>("Tag", TagSchema);
