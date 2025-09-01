// backend/model/ScreenShareGrant.ts
import { Schema, model, Document, Types } from "mongoose";

export type GrantMode = "single" | "all";
export type GrantRole = "Admin" | "Moderator" | "Participant" | "Observer";

export interface ScreenShareGrantDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;

  // "all" = everyone can share; "single" = one specific identity
  mode: GrantMode;

  // When mode = "single", we target by LiveKit identity (since participants are ephemeral)
  target?: {
    identity: string;          // LiveKit identity (string) — REQUIRED when mode="single"
    role?: GrantRole;          // optional: useful in logs
    name?: string;             // optional display
    email?: string;            // optional display
    userId?: Types.ObjectId;   // optional if target is a real user (mod/admin/observer)
  };

  // Who granted the permission (mods/admins usually have a DB user)
  granter: {
    userId?: Types.ObjectId;
    identity: string;          // LiveKit identity of the granter
    role: Exclude<GrantRole, "Participant" | "Observer">; // Admin|Moderator
    name?: string;
    email?: string;
  };

  grantedAt: Date;
  revokedAt?: Date;
}

const ScreenShareGrantSchema = new Schema<ScreenShareGrantDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },

    mode: { type: String, enum: ["single", "all"], required: true },

    target: {
      identity: { type: String, required: function () { return this.mode === "single"; } },
      role: { type: String, enum: ["Admin", "Moderator", "Participant", "Observer"] },
      name: String,
      email: String,
      userId: { type: Schema.Types.ObjectId, ref: "User" },
    },

    granter: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      identity: { type: String, required: true },
      role: { type: String, enum: ["Admin", "Moderator"], required: true },
      name: String,
      email: String,
    },

    grantedAt: { type: Date, default: () => new Date() },
    revokedAt: Date,
  },
  { timestamps: false }
);

// Fast lookups:
// - active "all" grants for a session
ScreenShareGrantSchema.index({ sessionId: 1, mode: 1, revokedAt: 1, grantedAt: -1 });
// - active "single" grant for a specific identity
ScreenShareGrantSchema.index({ sessionId: 1, "target.identity": 1, revokedAt: 1, grantedAt: -1 });

export default model<ScreenShareGrantDoc>("ScreenShareGrant", ScreenShareGrantSchema);
