import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import {
  ensureSessionKey,
  getOrInitWb,
  setOpen,
} from "../socket/whiteboardState";
import { emitToRoom } from "../socket/bus";

const RoleEnum = z.enum(["Participant", "Observer", "Moderator", "Admin"]);

const OpenCloseSchema = z.object({
  sessionId: z.string().min(1),
  role: RoleEnum,
});

export const openWhiteboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const p = OpenCloseSchema.safeParse(req.body);
  if (!p.success) return next(new ErrorHandler("Invalid payload", 400));
  const { sessionId, role } = p.data;
  if (!(role === "Moderator" || role === "Admin")) {
    return next(new ErrorHandler("Forbidden", 403));
  }
  const key = ensureSessionKey(sessionId);
  const wb = setOpen(sessionId, true);
  emitToRoom(`wb::${sessionId}`, "wb:state", {
    open: true,
    sessionKey: key,
    rolesAllowed: Array.from(wb.rolesAllowed),
  });
  sendResponse(res, { ok: true, sessionKey: key }, "Whiteboard opened", 200);
};

export const closeWhiteboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const p = OpenCloseSchema.safeParse(req.body);
  if (!p.success) return next(new ErrorHandler("Invalid payload", 400));
  const { sessionId, role } = p.data;
  if (!(role === "Moderator" || role === "Admin")) {
    return next(new ErrorHandler("Forbidden", 403));
  }
  setOpen(sessionId, false);
  const wb = getOrInitWb(sessionId);
  emitToRoom(`wb::${sessionId}`, "wb:state", {
    open: false,
    sessionKey: wb.sessionKey,
    rolesAllowed: Array.from(wb.rolesAllowed),
  });
  sendResponse(res, { ok: true }, "Whiteboard closed", 200);
};

export const getWhiteboardHistory = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const sessionId = String(req.query.sessionId || "");
  if (!sessionId) throw new ErrorHandler("sessionId required", 400);
  const wb = getOrInitWb(sessionId);
  sendResponse(
    res,
    { ok: true, sessionKey: wb.sessionKey || "", patches: [] },
    "Whiteboard history",
    200
  );
};
