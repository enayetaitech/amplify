// backend/model/WhiteboardStroke.ts
import { Schema, model, Document } from "mongoose";

export interface WhiteboardStrokeDoc extends Document {
  roomName: string;
  sessionId: string; // whiteboard sessionId (string), not DB ObjectId
  seq: number;
  author: { identity: string; name?: string; role: string };
  tool: string;
  shape: "free" | "line" | "rect" | "circle" | "text";
  color: string;
  size: number;
  points: { x: number; y: number }[];
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  text?: string;
  ts: Date;
  revoked?: boolean;
}

const WhiteboardStrokeSchema = new Schema<WhiteboardStrokeDoc>(
  {
    roomName: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    seq: { type: Number, required: true, index: true },
    author: { identity: String, name: String, role: String },
    tool: String,
    shape: {
      type: String,
      enum: ["free", "line", "rect", "circle", "text"],
      default: "free",
    },
    color: String,
    size: Number,
    points: [{ x: Number, y: Number }],
    from: { x: Number, y: Number },
    to: { x: Number, y: Number },
    text: String,
    ts: { type: Date, default: () => new Date(), index: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: false }
);
WhiteboardStrokeSchema.index(
  { roomName: 1, sessionId: 1, seq: 1 },
  { unique: true }
);

export default model<WhiteboardStrokeDoc>(
  "WhiteboardStroke",
  WhiteboardStrokeSchema
);
