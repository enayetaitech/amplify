import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { SessionModel } from "../model/SessionModel";
import BreakoutRoom from "../model/BreakoutRoom";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import {
  ensureRoom,
  roomService,
  startHlsEgress,
  stopHlsEgress,
  startFileEgress,
  stopFileEgress,
} from "../processors/livekit/livekitService";
import { emitBreakoutsChanged, emitToRoom } from "../socket/bus";
import config from "../config/index";
import { TrackSource } from "livekit-server-sdk";
import {
  cancelBreakoutCloseTimer,
  scheduleBreakoutCloseTimer,
} from "../services/breakoutScheduler";

export const createBreakoutRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }

  const session = await SessionModel.findById(sessionId).lean();
  if (!session) return next(new ErrorHandler("Session not found", 404));
  if (!session.breakoutRoom)
    return next(
      new ErrorHandler("Breakout room not enabled for this session", 403)
    );

  const last = await BreakoutRoom.findOne({
    sessionId: new Types.ObjectId(sessionId),
  })
    .sort({ index: -1 })
    .lean();
  const index = last ? last.index + 1 : 1;
  const livekitRoom = `${String(sessionId)}__bo__${index}`;

  await ensureRoom(livekitRoom, { emptyTimeout: 60 * 60 });

  let egressId: string | undefined;
  let playbackUrl: string | null = null;
  let fileEgressId: string | undefined;
  try {
    const e = await startHlsEgress(livekitRoom);
    egressId = e.egressId;
    playbackUrl = e.playbackUrl || null;
  } catch {}

  // auto-start MP4 file egress (recording) only when explicitly enabled
  if (config.enable_breakout_file_recording === "true") {
    try {
      const rec = await startFileEgress(livekitRoom);
      fileEgressId = rec.egressId;
    } catch {}
  }

  const closesAtDefault = new Date(Date.now() + 2 * 60 * 1000);
  await BreakoutRoom.create({
    sessionId: new Types.ObjectId(sessionId),
    index,
    livekitRoom,
    closesAt: closesAtDefault,
    hls: playbackUrl
      ? { egressId, playbackUrl, startedAt: new Date() }
      : undefined,
    recording: fileEgressId
      ? { egressId: fileEgressId, startedAt: new Date() }
      : undefined,
  });

  // schedule default auto-close
  try {
    scheduleBreakoutCloseTimer(String(sessionId), index, closesAtDefault);
  } catch {}

  // no closesAt set here by default; panel can later extend and we'll schedule timer then

  sendResponse(
    res,
    { index, roomName: livekitRoom, playbackUrl },
    "Breakout created"
  );
  try {
    emitBreakoutsChanged(String(sessionId));
  } catch {}
};

export const listBreakouts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }
  const items = await BreakoutRoom.find({
    sessionId: new Types.ObjectId(sessionId),
    $or: [{ closedAt: { $exists: false } }, { closedAt: null }],
  })
    .sort({ index: 1 })
    .lean();
  sendResponse(res, { items }, "Breakouts");
};

// Public (no auth) – for observers to read breakout HLS
export const listBreakoutsPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }
  const items = await BreakoutRoom.find({
    sessionId: new Types.ObjectId(sessionId),
    $or: [{ closedAt: { $exists: false } }, { closedAt: null }],
  })
    .sort({ index: 1 })
    .lean();

  // Limit to fields observers need
  const mapped = items.map((b) => ({
    index: b.index,
    livekitRoom: b.livekitRoom,
    hls: { playbackUrl: b.hls?.playbackUrl || null },
  }));
  sendResponse(res, { items: mapped }, "Breakouts");
};

export async function closeBreakoutByIndex(sessionId: string, idx: number) {
  const bo = await BreakoutRoom.findOne({
    sessionId: new Types.ObjectId(sessionId),
    index: idx,
  });
  if (!bo) throw new Error("Breakout not found");

  // stop HLS egress if running
  if (bo.hls?.egressId) {
    await stopHlsEgress(bo.hls.egressId);
    bo.hls.stoppedAt = new Date();
  }
  // stop file egress if running (only if feature enabled)
  if (
    config.enable_breakout_file_recording === "true" &&
    bo.recording?.egressId
  ) {
    await stopFileEgress(bo.recording.egressId);
    bo.recording.stoppedAt = new Date();
  }

  // attempt to move participants back to main room, collect identities
  const movedIdentities: string[] = [];
  try {
    const ps = await roomService.listParticipants(bo.livekitRoom);
    for (const p of ps) {
      if (p?.identity) movedIdentities.push(p.identity);
      try {
        await roomService.moveParticipant(
          bo.livekitRoom,
          p.identity,
          String(sessionId)
        );
      } catch {}
    }
  } catch {}

  bo.closedAt = new Date();
  await bo.save();
  try {
    emitBreakoutsChanged(String(sessionId));
  } catch {}

  // notify moderators/admins and participants
  try {
    emitToRoom(`observer::${sessionId}`, "breakout:closed-mod", { index: idx });
    emitToRoom(String(sessionId), "breakout:closed", {
      index: idx,
      identities: movedIdentities,
    });
    // trigger UI refreshes for participant pickers
    emitToRoom(String(sessionId), "meeting:participants-changed", {});
  } catch {}
}

export const closeBreakout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId, index } = req.params as {
    sessionId: string;
    index: string;
  };
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }
  const idx = Number(index);
  if (!idx || idx < 1)
    return next(new ErrorHandler("Invalid breakout index", 400));

  try {
    await closeBreakoutByIndex(String(sessionId), idx);
    // cancel any pending timer
    cancelBreakoutCloseTimer(String(sessionId), idx);
  } catch (e: any) {
    return next(new ErrorHandler(e?.message || "Breakout not found", 404));
  }
  sendResponse(res, { ok: true }, "Breakout closed");
};

export const extendBreakout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId, index } = req.params as {
    sessionId: string;
    index: string;
  };
  const { addMinutes } = req.body || {};
  const minutes = Number(addMinutes) || 0;
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }
  const idx = Number(index);
  if (!idx || idx < 1)
    return next(new ErrorHandler("Invalid breakout index", 400));
  if (minutes <= 0)
    return next(new ErrorHandler("addMinutes must be > 0", 400));

  const bo = await BreakoutRoom.findOne({
    sessionId: new Types.ObjectId(sessionId),
    index: idx,
  });
  if (!bo) return next(new ErrorHandler("Breakout not found", 404));

  const base =
    bo.closesAt && bo.closesAt > new Date()
      ? bo.closesAt.getTime()
      : Date.now();
  bo.closesAt = new Date(base + minutes * 60 * 1000);
  await bo.save();
  sendResponse(res, { closesAt: bo.closesAt }, "Breakout extended");
  try {
    emitBreakoutsChanged(String(sessionId));
  } catch {}
  // schedule/refresh auto-close timer
  try {
    scheduleBreakoutCloseTimer(String(sessionId), idx, bo.closesAt!);
  } catch {}
};

export const moveParticipantToBreakout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params as { sessionId: string };
  const { identity, toIndex } = req.body || {};
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }
  if (!identity) return next(new ErrorHandler("identity required", 400));
  const idx = Number(toIndex);
  if (!idx || idx < 1)
    return next(new ErrorHandler("Invalid breakout index", 400));

  const bo = await BreakoutRoom.findOne({
    sessionId: new Types.ObjectId(sessionId),
    index: idx,
  }).lean();
  if (!bo) return next(new ErrorHandler("Breakout not found", 404));

  await roomService.moveParticipant(
    String(sessionId),
    String(identity),
    bo.livekitRoom
  );
  // Restore baseline publish sources (MIC + CAMERA) in destination room
  try {
    const list = await roomService.listParticipants(bo.livekitRoom);
    const found = list.find((pi) => pi.identity === String(identity));
    const prev =
      (found &&
        (
          found as unknown as {
            permission?: { canPublishSources?: TrackSource[] };
          }
        ).permission) ||
      {};
    const prevSources = Array.isArray(
      (prev as { canPublishSources?: TrackSource[] }).canPublishSources
    )
      ? ((prev as { canPublishSources?: TrackSource[] })
          .canPublishSources as TrackSource[])
      : [];
    const baseline: TrackSource[] = [
      TrackSource.MICROPHONE,
      TrackSource.CAMERA,
    ];
    const next = Array.from(
      new Set((prevSources.length ? prevSources : baseline).concat(baseline))
    );
    await roomService.updateParticipant(bo.livekitRoom, String(identity), {
      permission: { ...(prev as any), canPublishSources: next },
    });
  } catch {}
  sendResponse(res, { ok: true }, "Moved");
};

export const moveParticipantToMain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params as { sessionId: string };
  const { identity, fromIndex } = req.body || {};
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }
  if (!identity) return next(new ErrorHandler("identity required", 400));
  const idx = Number(fromIndex);
  if (!idx || idx < 1)
    return next(new ErrorHandler("Invalid breakout index", 400));

  const bo = await BreakoutRoom.findOne({
    sessionId: new Types.ObjectId(sessionId),
    index: idx,
  }).lean();
  if (!bo) return next(new ErrorHandler("Breakout not found", 404));

  await roomService.moveParticipant(
    bo.livekitRoom,
    String(identity),
    String(sessionId)
  );
  // Restore baseline publish sources (MIC + CAMERA) in destination room
  try {
    const list = await roomService.listParticipants(String(sessionId));
    const found = list.find((pi) => pi.identity === String(identity));
    const prev =
      (found &&
        (
          found as unknown as {
            permission?: { canPublishSources?: TrackSource[] };
          }
        ).permission) ||
      {};
    const prevSources = Array.isArray(
      (prev as { canPublishSources?: TrackSource[] }).canPublishSources
    )
      ? ((prev as { canPublishSources?: TrackSource[] })
          .canPublishSources as TrackSource[])
      : [];
    const baseline: TrackSource[] = [
      TrackSource.MICROPHONE,
      TrackSource.CAMERA,
    ];
    const next = Array.from(
      new Set((prevSources.length ? prevSources : baseline).concat(baseline))
    );
    await roomService.updateParticipant(String(sessionId), String(identity), {
      permission: { ...(prev as any), canPublishSources: next },
    });
  } catch {}
  sendResponse(res, { ok: true }, "Moved");
};

export const listParticipantsOfRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params as { sessionId: string };
  const { room } = req.query as { room?: string };
  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return next(new ErrorHandler("Invalid sessionId", 400));
  }
  const roomName = room && typeof room === "string" ? room : String(sessionId);
  const ps = await roomService.listParticipants(roomName);
  const items = (ps || [])
    .filter((p: any) => {
      if (p?.permission?.hidden) return false;
      let role: string | undefined;
      try {
        const md = p?.metadata ? JSON.parse(p.metadata) : {};
        role = md?.role as string | undefined;
      } catch {}
      if (role === "Admin" || role === "Moderator") return false;
      return true;
    })
    .map((p: any) => {
      let label = p?.name || "";
      if (!label && p?.metadata) {
        try {
          const md = JSON.parse(p.metadata) || {};
          label = (md?.email as string) || "";
        } catch {}
      }
      if (!label) label = p.identity;
      return { identity: p.identity, name: label };
    });
  sendResponse(res, { items }, "Participants");
};
