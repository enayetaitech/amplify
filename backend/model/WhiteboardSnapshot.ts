// backend/model/WhiteboardSnapshot.ts
import { Schema, model, Document, Types } from "mongoose";

export interface WhiteboardSnapshotDoc extends Document<Types.ObjectId> {
  wbSessionId: string; // matches WhiteboardStroke.sessionId
  pngKey: string;
  width: number;
  height: number;
  takenBy: Types.ObjectId;
  ts: Date;
}

const WhiteboardSnapshotSchema = new Schema<WhiteboardSnapshotDoc>(
  {
    wbSessionId: { type: String, required: true, index: true },
    pngKey: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    takenBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ts: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export default model<WhiteboardSnapshotDoc>("WhiteboardSnapshot", WhiteboardSnapshotSchema);
