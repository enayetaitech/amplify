import { Schema, model, Types, Document } from "mongoose";
import { ISessionDeliverable } from "../../shared/interface/SessionDeliverableInterface"

/* Convert string IDs to ObjectId for Mongo layer */
type DeliverableDB = Omit<
ISessionDeliverable,
  "_id" | "sessionId" | "projectId" | "uploadedBy"
> & {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  projectId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
};

export interface SessionDeliverableDocument
  extends Document<Types.ObjectId, {}, DeliverableDB>,
    DeliverableDB {}

const DeliverableSchema = new Schema<SessionDeliverableDocument>(
  {
    sessionId:  { type: Schema.Types.ObjectId, ref: "Session",  required: true },
    projectId:  { type: Schema.Types.ObjectId, ref: "Project",  required: true },

    type: {
      type:    String,
      enum:    [
        "AUDIO",
        "VIDEO",
        "TRANSCRIPT",
        "BACKROOM_CHAT",
        "SESSION_CHAT",
        "WHITEBOARD",
        "POLL_RESULT",
      ],
      required: true,
    },
    displayName:  { type: String, required: true, trim: true },
    size:         { type: Number, required: true }, 
    storageKey:   { type: String, required: true, trim: true },
    uploadedBy:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const SessionDeliverableModel = model<SessionDeliverableDocument>(
  "SessionDeliverable",
  DeliverableSchema
);
