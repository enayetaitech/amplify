// backend/model/ChatMessage.ts
import { Schema, model, Document, Types } from "mongoose";

export type ChatScope = "waiting" | "main" | "breakout" | "observer";
export type ChatType  = "group" | "dm";
export type ChatRole  = "Moderator" | "Participant" | "Observer";

type IdentityRef = {
  /** LiveKit identity (string) — always present so we can route even if no userId exists */
  identity: string;
  /** Optional DB user for Mods/Admins/Observers (Participants won't have this) */
  userId?: Types.ObjectId;
  /** For transcript UX */
  name?: string;
  email?: string;
  role: ChatRole;
};

export interface ChatMessageDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  scope: ChatScope;
  breakoutIndex?: number;        // only for scope='breakout'
  type: ChatType;                // 'group' or 'dm'

  from: IdentityRef;
  /** Present only for 'dm' messages; when DM to a Participant, userId may be undefined */
  to?: Omit<IdentityRef, "name" | "email" | "role"> & { role: ChatRole };

  text: string;
  attachments?: { storageKey: string; displayName: string; size: number }[];
  ts: Date;
}

const IdentityRefSchema = new Schema<IdentityRef>(
  {
    identity: { type: String, required: true, index: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    role: { type: String, enum: ["Moderator", "Participant", "Observer"], required: true },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<ChatMessageDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    scope: { type: String, enum: ["waiting", "main", "breakout", "observer"], required: true },
    breakoutIndex: Number,
    type: { type: String, enum: ["group", "dm"], required: true },

    from: { type: IdentityRefSchema, required: true },
    to: {
      type: new Schema(
        {
          identity: { type: String, required: function (this: any) { return this?.type === "dm"; } },
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          role: { type: String, enum: ["Moderator", "Participant", "Observer"], required: function (this: any) { return this?.type === "dm"; } },
        },
        { _id: false }
      ),
      required: function (this: any) { return this?.type === "dm"; },
    },

    text: { type: String, required: true },
    attachments: [{ storageKey: String, displayName: String, size: Number }],
    ts: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

// Primary timeline read
ChatMessageSchema.index({ sessionId: 1, scope: 1, ts: 1 });
// DM lookups by identities
ChatMessageSchema.index({ sessionId: 1, "from.identity": 1, ts: 1 });
ChatMessageSchema.index({ sessionId: 1, "to.identity": 1, ts: 1 });
// Breakout filtering
ChatMessageSchema.index({ sessionId: 1, scope: 1, breakoutIndex: 1, ts: 1 });

export default model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);
