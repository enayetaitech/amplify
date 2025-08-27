// src/processors/live/meetingProcessor.ts

import config from "../../config/index";
import { LiveSessionModel } from "../../model/LiveSessionModel";
import { SessionModel } from "../../model/SessionModel";
import {
  startHlsEgress,
  stopHlsEgress,
  startFileEgress,
  stopFileEgress,
  ensureRoom,
} from "./livekitService";
import mongoose from "mongoose";

type ObjectIdLike = string | mongoose.Types.ObjectId;

function makeRoomName(session: any) {
  // Adjust to your naming convention if you already set one
  return `project_${session.projectId}_session_${session._id}`;
}

export async function startMeeting(
  sessionId: ObjectIdLike,
  startedBy: ObjectIdLike
) {
  const session = await SessionModel.findById(sessionId);

  if (!session) throw new Error("Session not found");

  let live = await LiveSessionModel.findOne({ sessionId: session._id });
  if (!live) {
    live = await LiveSessionModel.create({ sessionId: session._id });
  }
  if (live.ongoing) {
    throw new Error("Session already ongoing");
  }

  const roomName = makeRoomName(session);

  await ensureRoom(roomName);


  const hls = await startHlsEgress(roomName); // { egressId, playbackUrl, playlistName }
  const rec = await startFileEgress(roomName);

  live.ongoing = true;
  live.startTime = new Date();
  live.startedBy = startedBy as any;

  live.hlsPlaybackUrl = hls.playbackUrl ?? null;
  live.hlsEgressId = hls.egressId ?? null;
  live.hlsPlaylistName = hls.playlistName ?? null;
  live.fileEgressId = rec.egressId ?? null;

  await live.save();

  return {
    sessionId: String(session._id),
    roomName,
    hlsPlaybackUrl: live.hlsPlaybackUrl,
    startedAt: live.startTime,
  };
}

export async function endMeeting(
  sessionId: ObjectIdLike,
  endedBy: ObjectIdLike
) {
  const session = await SessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  const live = await LiveSessionModel.findOne({ sessionId: session._id });
  if (!live || !live.ongoing) {
    // Idempotent: nothing to stop
    return { sessionId: String(session._id), alreadyEnded: true };
  }

  // const roomName = makeRoomName(session);

  // Stop egress
  await stopHlsEgress(live.hlsEgressId || undefined);
  await stopFileEgress(live.fileEgressId || undefined);

  live.ongoing = false;
  live.endTime = new Date();
  live.endedBy = endedBy as any;

  await live.save();

  return {
    sessionId: String(session._id),
    roomName: makeRoomName(session),
    endedAt: live.endTime,
  };
}
