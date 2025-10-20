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
import { finalizeSessionDeliverables } from "../session/finalizeDeliverables";

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

  const roomName = String(session._id);

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

  // finalize deliverables BEFORE clearing HLS/file fields so URLs are available
  try {
    await finalizeSessionDeliverables(String(session._id), String(endedBy));
  } catch (e) {
    try {
      console.error("finalizeSessionDeliverables failed", e);
    } catch {}
  }

  // Ensure streaming flag and HLS fields are cleared when meeting ends
  try {
    live.streaming = false;
  } catch {}
  live.hlsStoppedAt = new Date();
  live.hlsEgressId = null;
  live.hlsPlaybackUrl = null;
  live.hlsPlaylistName = null;
  live.fileEgressId = null;

  live.ongoing = false;
  live.endTime = new Date();
  live.endedBy = endedBy as any;

  // Record leave time for any participants still listed when meeting ends
  try {
    if (live.participantsList && live.participantsList.length) {
      live.participantHistory = live.participantHistory || [];
      for (const user of live.participantsList) {
        live.participantHistory.push({
          id: (user && ((user as any)._id || (user as any).id)) || undefined,
          name: user?.name || user?.email || "",
          email: user?.email || "",
          joinedAt: (user && (user.joinedAt || null)) || null,
          leaveAt: live.endTime,
          reason: "Meeting Ended",
        } as any);
      }
      // clear active participants list as meeting ended
      live.participantsList = [] as any;
    }
  } catch (e) {
    // non-critical: don't prevent meeting end
    try {
      console.error("endMeeting - recording participantHistory failed", e);
    } catch {}
  }

  await live.save();

  return {
    sessionId: String(session._id),
    roomName: makeRoomName(session),
    endedAt: live.endTime,
  };
}
