// src/processors/live/meetingProcessor.ts

import { EgressClient, EncodedFileOutput, S3Upload } from "livekit-server-sdk";
import config from "../../config/index";
import { LiveSessionModel } from "../../model/LiveSessionModel";
import { SessionModel } from "../../model/SessionModel";
import {
  startHlsEgress,
  stopHlsEgress,
  startFileEgress,
  stopFileEgress,
  ensureRoom,
  hlsPaths,
} from "./livekitService";
import mongoose from "mongoose";

const egress = new EgressClient(config.livekit_api_url!, config.livekit_api_key!, config.livekit_api_secret!);

type ObjectIdLike = string | mongoose.Types.ObjectId;

function makeRoomName(session: any) {
  // Adjust to your naming convention if you already set one
  return `project_${session.projectId}_session_${session._id}`;
}

export async function startMeeting(
  sessionId: ObjectIdLike,
  startedBy: ObjectIdLike,
  userRole: string
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

  const createdRoom = await ensureRoom(roomName);

  console.log("Created room", createdRoom);

  let egressInfo = null;

try {
  egressInfo = await startHlsEgress(roomName);
} catch (e) {
  console.error(
    "HLS start error:",
    e 
  );
}

const { liveUrl, vodUrl} = hlsPaths(roomName);

console.log('liveUrl', liveUrl)
console.log('vodUrl', vodUrl)

  live.ongoing = true;
  live.startTime = new Date();
  live.startedBy = startedBy as any;

  live.hlsPlaybackUrl = liveUrl ?? null;
  live.hlsEgressId = egressInfo?.egressId ?? null;
  live.hlsPlaylistName = vodUrl ?? null;
  live.fileEgressId =  null;

  await live.save();

  console.log('room name', roomName)
  console.log('hlsPlaybackUrl', live.hlsPlaybackUrl)
  console.log('hlsEgressId', live.hlsEgressId)
  console.log('hlsPlaylistName', live.hlsPlaylistName)
  console.log('fileEgressId', live.fileEgressId)

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
