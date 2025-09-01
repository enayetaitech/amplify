// backend/model/ChatMessage.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ChatMessageDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  scope: "waiting" | "main" | "breakout" | "observer";
  breakoutIndex?: number;
  type: "group" | "dm";
  from: { role: "Moderator" | "Participant" | "Observer"; userId?: Types.ObjectId; name?: string; email?: string };
  to?: { role: "Moderator" | "Participant" | "Observer"; userId?: Types.ObjectId };
  text: string;
  attachments?: { storageKey: string; displayName: string; size: number }[];
  ts: Date;
}

const ChatMessageSchema = new Schema<ChatMessageDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    scope: { type: String, enum: ["waiting", "main", "breakout", "observer"], required: true },
    breakoutIndex: Number,
    type: { type: String, enum: ["group", "dm"], required: true },
    from: {
      role: { type: String, enum: ["Moderator", "Participant", "Observer"], required: true },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: String,
      email: String,
    },
    to: {
      role: { type: String, enum: ["Moderator", "Participant", "Observer"] },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },
    text: { type: String, required: true },
    attachments: [{ storageKey: String, displayName: String, size: Number }],
    ts: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);
ChatMessageSchema.index({ sessionId: 1, scope: 1, ts: 1 });

export default model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);