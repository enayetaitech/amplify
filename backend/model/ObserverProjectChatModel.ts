import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IObserverProjectChatDoc extends Document {
  projectId: Types.ObjectId;
  senderEmail: string;
  name: string;
  content: string;
  scope: string;
  timestamp: Date;
}

const ObserverProjectChatSchema = new Schema<IObserverProjectChatDoc>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    senderEmail: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    scope: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

// Index for efficient querying by projectId and timestamp (for 24-hour window)
ObserverProjectChatSchema.index({ projectId: 1, timestamp: -1 });
ObserverProjectChatSchema.index({ projectId: 1, timestamp: 1 });

export const ObserverProjectChatModel: Model<IObserverProjectChatDoc> =
  mongoose.model<IObserverProjectChatDoc>(
    "ObserverProjectChat",
    ObserverProjectChatSchema
  );

export default ObserverProjectChatModel;

