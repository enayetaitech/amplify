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
} from "../processors/livekit/livekitService";

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
  try {
    const e = await startHlsEgress(livekitRoom);
    egressId = e.egressId;
    playbackUrl = e.playbackUrl || null;
  } catch {}

  await BreakoutRoom.create({
    sessionId: new Types.ObjectId(sessionId),
    index,
    livekitRoom,
    hls: playbackUrl
      ? { egressId, playbackUrl, startedAt: new Date() }
      : undefined,
  });

  sendResponse(
    res,
    { index, roomName: livekitRoom, playbackUrl },
    "Breakout created"
  );
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

  const bo = await BreakoutRoom.findOne({
    sessionId: new Types.ObjectId(sessionId),
    index: idx,
  });
  if (!bo) return next(new ErrorHandler("Breakout not found", 404));

  // stop HLS egress if running
  if (bo.hls?.egressId) {
    await stopHlsEgress(bo.hls.egressId);
    bo.hls.stoppedAt = new Date();
  }

  // attempt to move participants back to main room
  try {
    const ps = await roomService.listParticipants(bo.livekitRoom);
    for (const p of ps) {
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
