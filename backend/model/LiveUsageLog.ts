// backend/model/LiveUsageLog.ts
import { Schema, model, Document, Types } from "mongoose";

export interface LiveUsageLogDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  projectId: Types.ObjectId;
  startedBy: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  minutesTotal?: number;
  participantsPeak?: number;
  observersPeak?: number;
  creditsUsed?: number;
}

const LiveUsageLogSchema = new Schema<LiveUsageLogDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, default: () => new Date(), index: true },
    endedAt: Date,
    minutesTotal: Number,
    participantsPeak: Number,
    observersPeak: Number,
    creditsUsed: Number,
  },
  { timestamps: false }
);
LiveUsageLogSchema.index({ sessionId: 1 });

export default model<LiveUsageLogDoc>("LiveUsageLog", LiveUsageLogSchema);