import mongoose, { Document, Schema, Model } from "mongoose";
import { IObserverGroupMessage } from "../../shared/interface/ObserverGroupMessageInterface";

export interface IObserverGroupMessageDoc
  extends Omit<IObserverGroupMessage, "_id">,
    Document {}

const ObserverGroupMessageSchema = new Schema<IObserverGroupMessageDoc>(
  {
    meetingId:   { type: String, required: true },
    senderEmail: { type: String, required: true },
    name:        { type: String, required: true },
    content:     { type: String, required: true },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

export const ObserverGroupMessageModel: Model<IObserverGroupMessageDoc> =
  mongoose.model<IObserverGroupMessageDoc>(
    "ObserverGroupMessage",
    ObserverGroupMessageSchema
  );

export default ObserverGroupMessageModel;
