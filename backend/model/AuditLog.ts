import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditAction =
  | "user.create"
  | "user.edit"
  | "user.status"
  | "user.resendInvite"
  | "externalAdmin.transferProjects"
  | "externalAdmin.delete";

export type AuditTarget = "User" | "Project";

export interface AuditLogDoc extends Document<Types.ObjectId> {
  actorId: Types.ObjectId;
  action: AuditAction;
  targetType: AuditTarget;
  targetId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, enum: ["User", "Project"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<AuditLogDoc> = mongoose.model<AuditLogDoc>(
  "AuditLog",
  AuditLogSchema
);
