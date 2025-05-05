// backend/model/ObserverDocumentModel.ts
import { Schema, model, Types, Document } from "mongoose";

import {IObserverDocument} from "../../shared/interface/ObserverDocumentInterface"
/* map string IDs → ObjectId for DB layer */
type ObserverDocDB = Omit<
  IObserverDocument,
  "_id" | "projectId" | "sessionId" | "addedBy"
> & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  sessionId: Types.ObjectId;
  addedBy: Types.ObjectId;
};

export interface ObserverDocument
  extends Document<Types.ObjectId, {}, ObserverDocDB>,
    ObserverDocDB {}

const ObserverDocSchema = new Schema<ObserverDocument>(
  {
    projectId:   { type: Schema.Types.ObjectId, ref: "Project", required: true },
    sessionId:   { type: Schema.Types.ObjectId, ref: "Session", required: true },
    displayName: { type: String, required: true, trim: true },
    size:        { type: Number, required: true }, 
    storageKey:  { type: String, required: true, trim: true },
    addedBy:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    addedByRole: {
      type: String,
      enum: ["ADMIN", "MODERATOR", "OBSERVER"],
      required: true,
    },
  },
  { timestamps: true }
);

export const ObserverDocumentModel = model<ObserverDocument>(
  "ObserverDocument",
  ObserverDocSchema
);
