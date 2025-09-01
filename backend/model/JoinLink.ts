import { Schema, model, Document, Types } from "mongoose";

export interface JoinLinkDoc extends Document<Types.ObjectId> {
  projectId: Types.ObjectId;
  type: "participant" | "observer";
  slug: string;              // unique per {projectId,type}
  passwordHash?: string;     // required for 'observer'
  createdBy: Types.ObjectId; // User
  createdAt: Date;
  updatedAt: Date;
}

const JoinLinkSchema = new Schema<JoinLinkDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    type: { type: String, enum: ["participant", "observer"], required: true },
    slug: { type: String, required: true, trim: true },
    passwordHash: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

JoinLinkSchema.index({ projectId: 1, type: 1 }, { unique: true });
JoinLinkSchema.index({ slug: 1 }, { unique: true });

export default model<JoinLinkDoc>("JoinLink", JoinLinkSchema);