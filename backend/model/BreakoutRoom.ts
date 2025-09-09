// backend/model/BreakoutRoom.ts
import { Schema, model, Document, Types } from "mongoose";

export interface BreakoutRoomDoc extends Document<Types.ObjectId> {
  sessionId: Types.ObjectId;
  index: number;
  livekitRoom: string;
  createdAt: Date;
  closesAt?: Date;
  closedAt?: Date;
  recording?: { egressId?: string; startedAt?: Date; stoppedAt?: Date };
  hls?: {
    egressId?: string;
    playbackUrl?: string;
    startedAt?: Date;
    stoppedAt?: Date;
  };
}

const BreakoutRoomSchema = new Schema<BreakoutRoomDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    index: { type: Number, required: true },
    livekitRoom: { type: String, required: true },
    closesAt: Date,
    closedAt: Date,
    recording: { egressId: String, startedAt: Date, stoppedAt: Date },
    hls: {
      egressId: String,
      playbackUrl: String,
      startedAt: Date,
      stoppedAt: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
BreakoutRoomSchema.index({ sessionId: 1, index: 1 }, { unique: true });

export default model<BreakoutRoomDoc>("BreakoutRoom", BreakoutRoomSchema);
