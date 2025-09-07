import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import * as sessionService from "../processors/liveSession/sessionService";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middlewares/authenticateJwt";
import {
  endMeeting,
  startMeeting,
} from "../processors/livekit/meetingProcessor";
import {
  EgressClient,
  RoomServiceClient,
  S3Upload,
  SegmentedFileOutput,
} from "livekit-server-sdk";
import config from "../config/index";

const canStartOrEnd = (role?: string) => {
  // Admin/Moderator can start/end meetings
  return role === "Admin" || role === "Moderator";
};

const LIVEKIT_API_URL = config.livekit_api_url;
const LIVEKIT_WS_URL = config.livekit_ws_url!;
const LIVEKIT_API_KEY = config.livekit_api_key!;
const LIVEKIT_API_SECRET = config.livekit_api_secret!;
const HLS_PUBLIC_BASE = config.hls_base_url!;
const HLS_PREFIX = config.hls_prefix! || "hls";

if (
  !LIVEKIT_API_URL ||
  !LIVEKIT_WS_URL ||
  !LIVEKIT_API_KEY ||
  !LIVEKIT_API_SECRET
) {
  console.error(
    "Missing envs. Set LIVEKIT_API_URL, LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET"
  );
  process.exit(1);
}

console.log("LIVEKIT_API_URL", LIVEKIT_API_URL);
console.log("LIVEKIT_WS_URL", LIVEKIT_WS_URL);
console.log("LIVEKIT_API_KEY", LIVEKIT_API_KEY);
console.log("LIVEKIT_API_SECRET", LIVEKIT_API_SECRET);
console.log("HLS_PUBLIC_BASE", HLS_PUBLIC_BASE);
console.log("HLS_PREFIX", HLS_PREFIX);
console.log("S3_ACCESS_KEY", config.s3_access_key);
console.log("S3_SECRET_ACCESS_KEY", config.s3_secret_access_key);
console.log("S3_BUCKET_NAME", config.s3_bucket_name);
console.log("S3_REGION", config.s3_bucket_region);
console.log("S3_ENDPOINT", config.s3_endpoint);
console.log("S3_FORCE_PATH_STYLE", config.s3_force_path_style);

function hlsPaths(roomName: string) {
  const dir = `${HLS_PREFIX}/${encodeURIComponent(roomName)}`;

  return {
    filenamePrefix: `${dir}/segment`,
    playlistName: "index.m3u8",
    livePlaylistName: "live.m3u8",
    liveUrl: HLS_PUBLIC_BASE ? `${HLS_PUBLIC_BASE}/${dir}/live.m3u8` : null,
    vodUrl: HLS_PUBLIC_BASE ? `${HLS_PUBLIC_BASE}/${dir}/index.m3u8` : null,
  };
}

const rooms = new RoomServiceClient(
  LIVEKIT_API_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);
const egress = new EgressClient(
  LIVEKIT_API_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);
const activeEgressByRoom = new Map();

async function stopAllEgress(roomName: string) {
  const ids = activeEgressByRoom.get(roomName);
  if (ids && ids.size) {
    for (const id of ids) {
      try {
        await egress.stopEgress(id);
      } catch (e: any) {
        console.warn("stopEgress error", id, e?.message || e);
      }
    }
    activeEgressByRoom.delete(roomName);
  }
}

export const startLiveSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) return next(new ErrorHandler("Not authenticated", 401));

  if (!canStartOrEnd(user.role))
    return next(new ErrorHandler("Forbidden", 403));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

  // IMPORTANT: use the exact same roomName clients use to join (sessionId)
  const roomName = String(sessionId);

  console.log("roomName", roomName);
  try {
    await rooms.createRoom({
      name: sessionId,
      emptyTimeout: 60 * 60,
    });
  } catch (_) {}

  const { filenamePrefix, playlistName, livePlaylistName } = hlsPaths(roomName);

  const segments = new SegmentedFileOutput({
    filenamePrefix,
    playlistName,
    livePlaylistName,
    segmentDuration: 2,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: config.s3_access_key!,
        secret: config.s3_secret_access_key,
        bucket: config.s3_bucket_name,
        region: config.s3_bucket_region,
        endpoint: config.s3_endpoint || undefined,
        forcePathStyle: config.s3_force_path_style === "true" || undefined,
      }),
    },
  });

  const info = await egress.startRoomCompositeEgress(
    roomName,
    { segments },
    { layout: "grid" }
  );

  console.log("info", info);

  if (!activeEgressByRoom.has(roomName))
    activeEgressByRoom.set(roomName, new Set());
  activeEgressByRoom.get(roomName).add(info.egressId);

  const { liveUrl, vodUrl } = hlsPaths(roomName);

  const result = {
    roomName,
    role: user.role,
    wsUrl: LIVEKIT_WS_URL,
    hls: { liveUrl, vodUrl },
    egressId: info.egressId,
  };

  console.log("result", result);

  // const result = await startMeeting(sessionId, user.userId, user.role);
  sendResponse(res, result, "Meeting started");
};

export const endLiveSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) return next(new ErrorHandler("Not authenticated", 401));

  if (!canStartOrEnd(user.role))
    return next(new ErrorHandler("Forbidden", 403));

  const { sessionId } = req.params;
  if (!sessionId) return next(new ErrorHandler("sessionId required", 400));

  const roomName = String(sessionId);

  try {
    await stopAllEgress(roomName);
  } catch {}

  try {
    await rooms.deleteRoom(roomName);
  } catch {}

  sendResponse(res, { roomName }, "Meeting ended");
};

export const getSessionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { sessionId } = req.params;
  const history = await sessionService.getSessionHistory(sessionId);
  sendResponse(res, history, "Session history retrieved", 200);
};
