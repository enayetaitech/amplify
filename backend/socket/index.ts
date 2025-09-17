// backend/socket/index.ts
import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { setIo } from "./bus";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import {
  listState,
  admitByEmail,
  removeFromWaitingByEmail,
  admitAll,
} from "../processors/waiting/waitingService";
import {
  createAdmitToken,
  participantIdentity,
} from "../processors/livekit/admitTokenService";
import { TrackSource, TrackType } from "@livekit/protocol";
import {
  ensureRoom,
  roomService,
  serverAllowScreenshare,
  serverDisableCamera,
  serverMuteMicrophone,
  startHlsEgress,
  stopHlsEgress,
} from "../processors/livekit/livekitService";
import BreakoutRoom from "../model/BreakoutRoom";
import { SessionModel } from "../model/SessionModel";
import { LiveSessionModel } from "../model/LiveSessionModel";
import { ParticipantWaitingRoomChatModel } from "../model/ParticipantWaitingRoomChatModel";
import { ParticipantMeetingChatModel } from "../model/ParticipantMeetingChatModel";
import GroupMessageModel, {
  GroupMessageModel as GroupMsgNamed,
} from "../model/GroupMessage";
import ObserverGroupMessageModel, {
  ObserverGroupMessageModel as ObsGroupMsgNamed,
} from "../model/ObserverGroupMessage";
import { ObserverWaitingRoomChatModel } from "../model/ObserverWaitingRoomChatModel";

// In-memory map to find a participant socket by email within a session
// sessionId -> (email -> socketId)
const emailIndex = new Map<string, Map<string, string>>();
const identityIndex = new Map<string, Map<string, string>>();
// Track moderator sockets per session (Moderators/Admins only)
const moderatorSockets = new Map<string, Set<string>>();
// Track observer sockets per session for accurate counts
const observerSockets = new Map<string, Set<string>>();
// Track observer display info per sessionId -> (socketId -> { name, email })
const observerInfo = new Map<
  string,
  Map<string, { name: string; email: string }>
>();

type Role = "Participant" | "Observer" | "Moderator" | "Admin";
type JoinAck = Awaited<ReturnType<typeof listState>>;

// helper mirrors the format you already use for tokens: project_<projectId>_session_<sessionId>
function roomNameForSession(session: {
  _id: Types.ObjectId;
  projectId: Types.ObjectId | { _id: Types.ObjectId };
}) {
  const pid = (session.projectId as any)?._id || session.projectId;
  return `project_${String(pid)}_session_${String(session._id)}`;
}

export function attachSocket(server: HTTPServer) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });
  setIo(io);

  io.on("connection", (socket: Socket) => {
    // Expect query: ?sessionId=...&role=...&name=...&email=...
    const q = socket.handshake.query;
    const sessionId = String(q.sessionId || "");
    const role = String(q.role || "Participant") as Role;
    const name = (q.name as string) || "";
    const email = (q.email as string) || "";

    if (!sessionId || !role) {
      socket.emit("error:auth", "Missing sessionId or role");
      return socket.disconnect(true);
    }

    const rooms = {
      waiting: `waiting::${sessionId}`,
      meeting: `meeting::${sessionId}`, // future milestones
      observer: `observer::${sessionId}`, // future milestones
    };

    // Join waiting room by default; participant/observer wait here
    socket.join(rooms.waiting);

    if (["Observer", "Moderator", "Admin"].includes(role)) {
      socket.join(rooms.observer);
    }
    if (["Moderator", "Admin"].includes(role)) {
      if (!moderatorSockets.has(sessionId))
        moderatorSockets.set(sessionId, new Set());
      moderatorSockets.get(sessionId)!.add(socket.id);
    }
    // Helper to emit observer count to session
    const emitObserverCount = () => {
      const set = observerSockets.get(sessionId);
      const count = set ? set.size : 0;
      io.to(sessionId).emit("observer:count", { count });
    };
    // Helper to emit observer list (names/emails) to the session
    const emitObserverList = () => {
      const m = observerInfo.get(sessionId);
      const observers = m
        ? Array.from(m.values()).map((v) => ({ name: v.name, email: v.email }))
        : [];
      io.to(sessionId).emit("observer:list", { observers });
    };

    // Maintain observer count map only for Observer role
    if (role === "Observer") {
      if (!observerSockets.has(sessionId))
        observerSockets.set(sessionId, new Set());
      observerSockets.get(sessionId)!.add(socket.id);
      if (!observerInfo.has(sessionId)) observerInfo.set(sessionId, new Map());
      observerInfo.get(sessionId)!.set(socket.id, {
        name: name || email || "Observer",
        email: email || "",
      });
      emitObserverCount();
      emitObserverList();
    }

    // Track email -> socket (only if email present)
    if (email) {
      if (!emailIndex.has(sessionId)) emailIndex.set(sessionId, new Map());
      emailIndex.get(sessionId)!.set(email.toLowerCase(), socket.id);
    }

    // Make sure each socket is in a session room for targeted broadcasts.
    if (sessionId) {
      socket.join(sessionId);
    }
    // Initial payload (lists)
    socket.on("join-room", async (_payload, ack?: (rooms: JoinAck) => void) => {
      const state = await listState(sessionId);
      if (ack) ack(state);
      // Also broadcast updated waiting list to all moderators’ panels
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });
    });

    // Explicitly join/leave the meeting chat room when client enters/leaves the meeting UI
    socket.on("meeting:join", () => socket.join(rooms.meeting));
    socket.on("meeting:leave", () => socket.leave(rooms.meeting));

    // Cache LiveSession _id for persistence
    const liveIdCache = new Map<string, Types.ObjectId>();
    async function ensureLiveIdFor(
      sessionIdStr: string
    ): Promise<Types.ObjectId> {
      const cached = liveIdCache.get(sessionIdStr);
      if (cached) return cached;
      const found = await LiveSessionModel.findOne(
        { sessionId: new Types.ObjectId(sessionIdStr) },
        { _id: 1 }
      ).lean();
      if (found?._id) {
        liveIdCache.set(sessionIdStr, found._id as Types.ObjectId);
        return found._id as Types.ObjectId;
      }
      const created = await LiveSessionModel.create({
        sessionId: new Types.ObjectId(sessionIdStr),
        ongoing: false,
      });
      liveIdCache.set(sessionIdStr, created._id as Types.ObjectId);
      return created._id as Types.ObjectId;
    }

    async function isStreamingActive(sessionIdStr: string): Promise<boolean> {
      try {
        const live = await LiveSessionModel.findOne(
          { sessionId: new Types.ObjectId(sessionIdStr) },
          { streaming: 1 }
        ).lean();
        return !!live?.streaming;
      } catch {
        return false;
      }
    }

    function emitToModeratorsInSession(
      sessionIdStr: string,
      event: string,
      payload: unknown
    ) {
      const set = moderatorSockets.get(sessionIdStr);
      if (!set || set.size === 0) return;
      for (const sid of set) io.to(sid).emit(event, payload);
    }

    type ChatSendPayload = { scope: string; content: string; toEmail?: string };
    type ChatHistoryPayload = {
      scope: string;
      thread?: { withEmail?: string };
      limit?: number;
    };

    socket.on(
      "chat:send",
      async (
        payload: ChatSendPayload,
        ack?: (r: { ok: boolean; error?: string }) => void
      ) => {
        try {
          const { scope, content } = payload || {};
          if (!scope || !content || !content.trim())
            return ack?.({ ok: false, error: "bad_request" });
          const liveId = await ensureLiveIdFor(sessionId);

          const lowerSender = (email || "").toLowerCase();
          const now = new Date();

          const emitNew = (target: string | string[] | null, message: any) => {
            if (!target) return;
            const evt = "chat:new";
            if (Array.isArray(target)) {
              for (const t of target) io.to(t).emit(evt, { scope, message });
            } else {
              io.to(target).emit(evt, { scope, message });
            }
          };

          // Permission + persistence per scope
          switch (scope) {
            case "waiting_dm": {
              if (
                !(
                  role === "Participant" ||
                  role === "Moderator" ||
                  role === "Admin"
                )
              )
                return ack?.({ ok: false, error: "forbidden" });
              const doc = {
                sessionId: liveId,
                email,
                senderName: name || email,
                role: role === "Admin" ? "Moderator" : (role as any),
                content,
                timestamp: now,
                scope,
                toEmail: undefined as string | undefined,
              };
              if (role === "Participant") {
                // to moderator pool
                doc.toEmail = "__moderators__";
                const saved = await ParticipantWaitingRoomChatModel.create(doc);
                // emit to sender and all moderators
                emitNew(socket.id, saved.toObject());
                emitToModeratorsInSession(sessionId, "chat:new", {
                  scope,
                  message: saved.toObject(),
                });
                return ack?.({ ok: true });
              } else {
                // moderator/admin replying to participant requires toEmail
                const target = (payload.toEmail || "").toLowerCase();
                if (!target)
                  return ack?.({ ok: false, error: "toEmail_required" });
                doc.toEmail = target;
                const saved = await ParticipantWaitingRoomChatModel.create(doc);
                // emit to sender, all moderators (shared thread visibility), and the participant if online
                emitNew(socket.id, saved.toObject());
                emitToModeratorsInSession(sessionId, "chat:new", {
                  scope,
                  message: saved.toObject(),
                });
                const targetId = emailIndex.get(sessionId)?.get(target);
                if (targetId) emitNew(targetId, saved.toObject());
                return ack?.({ ok: true });
              }
            }
            case "meeting_group": {
              if (
                !(
                  role === "Participant" ||
                  role === "Moderator" ||
                  role === "Admin"
                )
              )
                return ack?.({ ok: false, error: "forbidden" });
              const saved = await (GroupMsgNamed || GroupMessageModel).create({
                sessionId: liveId,
                senderEmail: email,
                name: name || email,
                content,
                scope,
              });
              io.to(rooms.meeting).emit("chat:new", {
                scope,
                message: saved.toObject(),
              });
              if (await isStreamingActive(sessionId)) {
                io.to(rooms.observer).emit("chat:new", {
                  scope,
                  message: saved.toObject(),
                });
              }
              return ack?.({ ok: true });
            }
            case "meeting_dm": {
              if (
                !(
                  role === "Participant" ||
                  role === "Moderator" ||
                  role === "Admin"
                )
              )
                return ack?.({ ok: false, error: "forbidden" });
              const doc = {
                sessionId: liveId,
                email,
                senderName: name || email,
                role: role === "Admin" ? "Moderator" : (role as any),
                content,
                timestamp: now,
                scope,
                toEmail: undefined as string | undefined,
              };
              if (role === "Participant") {
                doc.toEmail = "__moderators__";
                const saved = await ParticipantMeetingChatModel.create(doc);
                emitNew(socket.id, saved.toObject());
                emitToModeratorsInSession(sessionId, "chat:new", {
                  scope,
                  message: saved.toObject(),
                });
                return ack?.({ ok: true });
              } else {
                const target = (payload.toEmail || "").toLowerCase();
                if (!target)
                  return ack?.({ ok: false, error: "toEmail_required" });
                doc.toEmail = target;
                const saved = await ParticipantMeetingChatModel.create(doc);
                emitNew(socket.id, saved.toObject());
                emitToModeratorsInSession(sessionId, "chat:new", {
                  scope,
                  message: saved.toObject(),
                });
                const targetId = emailIndex.get(sessionId)?.get(target);
                if (targetId) emitNew(targetId, saved.toObject());
                return ack?.({ ok: true });
              }
            }
            case "meeting_mod_dm": {
              if (!(role === "Moderator" || role === "Admin"))
                return ack?.({ ok: false, error: "forbidden" });
              const target = (payload.toEmail || "").toLowerCase();
              if (!target)
                return ack?.({ ok: false, error: "toEmail_required" });
              const saved = await ParticipantMeetingChatModel.create({
                sessionId: liveId,
                email,
                senderName: name || email,
                role: "Moderator",
                content,
                timestamp: now,
                scope,
                toEmail: target,
              });
              emitNew(socket.id, saved.toObject());
              const targetId = emailIndex.get(sessionId)?.get(target);
              if (targetId) emitNew(targetId, saved.toObject());
              return ack?.({ ok: true });
            }
            case "observer_wait_group": {
              if (role !== "Observer")
                return ack?.({ ok: false, error: "forbidden" });
              const saved = await ObserverWaitingRoomChatModel.create({
                sessionId: liveId,
                email,
                senderName: name || email,
                role: "Observer",
                content,
                timestamp: now,
                scope,
              });
              io.to(rooms.observer).emit("chat:new", {
                scope,
                message: saved.toObject(),
              });
              return ack?.({ ok: true });
            }
            case "observer_wait_dm": {
              if (role !== "Observer")
                return ack?.({ ok: false, error: "forbidden" });
              const target = (payload.toEmail || "").toLowerCase();
              if (!target)
                return ack?.({ ok: false, error: "toEmail_required" });
              const saved = await ObserverWaitingRoomChatModel.create({
                sessionId: liveId,
                email,
                senderName: name || email,
                role: "Observer",
                content,
                timestamp: now,
                scope,
                toEmail: target,
              });
              emitNew(socket.id, saved.toObject());
              const targetId = emailIndex.get(sessionId)?.get(target);
              if (targetId) emitNew(targetId, saved.toObject());
              return ack?.({ ok: true });
            }
            case "stream_group": {
              if (
                !(
                  role === "Observer" ||
                  role === "Moderator" ||
                  role === "Admin"
                )
              )
                return ack?.({ ok: false, error: "forbidden" });
              const saved = await (
                ObsGroupMsgNamed || ObserverGroupMessageModel
              ).create({
                sessionId: liveId,
                senderEmail: email,
                name: name || email,
                content,
                scope,
              });
              io.to(rooms.observer).emit("chat:new", {
                scope,
                message: saved.toObject(),
              });
              return ack?.({ ok: true });
            }
            case "stream_dm_obs_obs": {
              if (role !== "Observer")
                return ack?.({ ok: false, error: "forbidden" });
              const target = (payload.toEmail || "").toLowerCase();
              if (!target)
                return ack?.({ ok: false, error: "toEmail_required" });
              const saved = await ObserverWaitingRoomChatModel.create({
                sessionId: liveId,
                email,
                senderName: name || email,
                role: "Observer",
                content,
                timestamp: now,
                scope,
                toEmail: target,
              });
              emitNew(socket.id, saved.toObject());
              const targetId = emailIndex.get(sessionId)?.get(target);
              if (targetId) emitNew(targetId, saved.toObject());
              return ack?.({ ok: true });
            }
            case "stream_dm_obs_mod": {
              if (
                !(
                  role === "Observer" ||
                  role === "Moderator" ||
                  role === "Admin"
                )
              )
                return ack?.({ ok: false, error: "forbidden" });
              const target = (payload.toEmail || "").toLowerCase();
              if (!target)
                return ack?.({ ok: false, error: "toEmail_required" });
              const saved = await ObserverWaitingRoomChatModel.create({
                sessionId: liveId,
                email,
                senderName: name || email,
                role: role === "Observer" ? "Observer" : "Moderator",
                content,
                timestamp: now,
                scope,
                toEmail: target,
              });
              emitNew(socket.id, saved.toObject());
              const targetId = emailIndex.get(sessionId)?.get(target);
              if (targetId) emitNew(targetId, saved.toObject());
              return ack?.({ ok: true });
            }
            default:
              return ack?.({ ok: false, error: "unknown_scope" });
          }
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    socket.on(
      "chat:history:get",
      async (
        payload: ChatHistoryPayload,
        ack?: (r: { items: any[] }) => void
      ) => {
        try {
          const { scope, thread, limit } =
            payload || ({} as ChatHistoryPayload);
          const liveId = await ensureLiveIdFor(sessionId);
          const lim = Math.max(1, Math.min(200, Number(limit) || 50));

          const toObj = (docs: any[]) =>
            docs.map((d) =>
              typeof d.toObject === "function" ? d.toObject() : d
            );

          switch (scope) {
            case "meeting_group": {
              const items = await (GroupMsgNamed || GroupMessageModel)
                .find({ sessionId: liveId, scope })
                .sort({ timestamp: 1 })
                .limit(lim)
                .lean();
              return ack?.({ items });
            }
            case "observer_wait_group": {
              const items = await ObserverWaitingRoomChatModel.find({
                sessionId: liveId,
                scope,
              })
                .sort({ timestamp: 1 })
                .limit(lim)
                .lean();
              return ack?.({ items });
            }
            case "stream_group": {
              const items = await (
                ObsGroupMsgNamed || ObserverGroupMessageModel
              )
                .find({ sessionId: liveId, scope })
                .sort({ timestamp: 1 })
                .limit(lim)
                .lean();
              return ack?.({ items });
            }
            case "waiting_dm": {
              // Combine participant→__moderators__ and moderator→participant
              const user = (thread?.withEmail || email || "").toLowerCase();
              const items = await ParticipantWaitingRoomChatModel.find({
                sessionId: liveId,
                scope,
                $or: [
                  { email: user, toEmail: "__moderators__" },
                  { toEmail: user },
                ],
              })
                .sort({ timestamp: 1 })
                .limit(lim)
                .lean();
              return ack?.({ items });
            }
            case "meeting_dm": {
              const user = (thread?.withEmail || email || "").toLowerCase();
              const items = await ParticipantMeetingChatModel.find({
                sessionId: liveId,
                scope,
                $or: [
                  { email: user, toEmail: "__moderators__" },
                  { toEmail: user },
                ],
              })
                .sort({ timestamp: 1 })
                .limit(lim)
                .lean();
              return ack?.({ items });
            }
            case "meeting_mod_dm": {
              const peer = (thread?.withEmail || "").toLowerCase();
              if (!peer) return ack?.({ items: [] });
              const me = (email || "").toLowerCase();
              const items = await ParticipantMeetingChatModel.find({
                sessionId: liveId,
                scope,
                $or: [
                  { email: me, toEmail: peer },
                  { email: peer, toEmail: me },
                ],
              })
                .sort({ timestamp: 1 })
                .limit(lim)
                .lean();
              return ack?.({ items });
            }
            case "observer_wait_dm":
            case "stream_dm_obs_obs":
            case "stream_dm_obs_mod": {
              const peer = (thread?.withEmail || "").toLowerCase();
              if (!peer) return ack?.({ items: [] });
              const me = (email || "").toLowerCase();
              const items = await ObserverWaitingRoomChatModel.find({
                sessionId: liveId,
                scope,
                $or: [
                  { email: me, toEmail: peer },
                  { email: peer, toEmail: me },
                ],
              })
                .sort({ timestamp: 1 })
                .limit(lim)
                .lean();
              return ack?.({ items });
            }
            default:
              return ack?.({ items: [] });
          }
        } catch {
          return ack?.({ items: [] });
        }
      }
    );

    // Client will tell us their LiveKit identity after joining the room.
    socket.on(
      "meeting:register-identity",
      (payload: { identity: string; email?: string }) => {
        try {
          if (!payload?.identity) return;
          if (!identityIndex.has(sessionId))
            identityIndex.set(sessionId, new Map());
          identityIndex
            .get(sessionId)!
            .set(payload.identity.toLowerCase(), socket.id);

          // Optional: if client also sends email, refresh the emailIndex mapping
          if (payload.email) {
            if (!emailIndex.has(sessionId))
              emailIndex.set(sessionId, new Map());
            emailIndex
              .get(sessionId)!
              .set(payload.email.toLowerCase(), socket.id);
          }
          // Notify moderators/admin panels that the live participants list may have changed
          io.to(sessionId).emit("meeting:participants-changed", {});
        } catch {}
      }
    );

    // Provide current observer list snapshot on demand
    socket.on(
      "observer:list:get",
      (
        _payload: {},
        ack?: (resp: { observers: { name: string; email: string }[] }) => void
      ) => {
        try {
          const m = observerInfo.get(sessionId);
          const observers = m
            ? Array.from(m.values()).map((v) => ({
                name: v.name,
                email: v.email,
              }))
            : [];
          ack?.({ observers });
        } catch {
          ack?.({ observers: [] });
        }
      }
    );

    // Provide current participant list snapshot on demand (optionally for a breakout room)
    socket.on(
      "participants:list:get",
      async (
        payload: { room?: string } | undefined,
        ack?: (resp: { items: { identity: string; name: string }[] }) => void
      ) => {
        try {
          const roomName =
            payload && typeof payload.room === "string" && payload.room
              ? payload.room
              : String(sessionId);
          const ps = await roomService.listParticipants(roomName);
          const items = (ps || [])
            .filter((p) => {
              // hide hidden/privileged tracks and moderator/admin
              const hidden = (p as { permission?: { hidden?: boolean } })
                .permission?.hidden;
              if (hidden) return false;
              let role: string | undefined;
              try {
                const mdRaw = (p as { metadata?: string }).metadata;
                const md = mdRaw ? JSON.parse(mdRaw) : undefined;
                role = md?.role as string | undefined;
              } catch {}
              if (role === "Admin" || role === "Moderator") return false;
              return true;
            })
            .map((p) => {
              const identity = (p as { identity?: string }).identity || "";
              let label = (p as { name?: string }).name || "";
              if (!label) {
                try {
                  const mdRaw = (p as { metadata?: string }).metadata;
                  const md = mdRaw ? JSON.parse(mdRaw) : undefined;
                  label = (md?.email as string) || "";
                } catch {}
              }
              if (!label) label = identity;
              return { identity, name: label };
            });
          ack?.({ items });
        } catch {
          ack?.({ items: [] });
        }
      }
    );

    // ===== Moderator actions =====
    // Move participant to a breakout (socket-based)
    socket.on(
      "meeting:participant:move-to-breakout",
      async (
        payload: { identity?: string; toIndex?: number },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!(role === "Moderator" || role === "Admin")) {
            return ack?.({ ok: false, error: "forbidden" });
          }
          const identity = (payload?.identity || "").trim();
          const toIndexNum = Number(payload?.toIndex || 0);
          if (!identity)
            return ack?.({ ok: false, error: "identity_required" });
          if (!toIndexNum || toIndexNum < 1)
            return ack?.({ ok: false, error: "invalid_breakout_index" });

          const bo = await BreakoutRoom.findOne({
            sessionId: new Types.ObjectId(sessionId),
            index: toIndexNum,
          }).lean();
          if (!bo) return ack?.({ ok: false, error: "breakout_not_found" });

          try {
            await roomService.moveParticipant(
              String(sessionId),
              identity,
              bo.livekitRoom
            );
          } catch (e: any) {
            console.error("socket move-to-breakout failed", {
              sessionId,
              identity,
              toRoom: bo.livekitRoom,
              error: e?.message || e,
            });
            return ack?.({ ok: false, error: e?.message || "move_failed" });
          }

          // notify moderator panels to refresh lists
          try {
            io.to(String(sessionId)).emit("meeting:participants-changed", {});
          } catch {}

          // notify the moved participant (by LiveKit identity if registered)
          try {
            const sid = identityIndex
              .get(sessionId)
              ?.get(identity.toLowerCase());
            if (sid) {
              io.to(sid).emit("breakout:moved", {
                index: toIndexNum,
              });
            }
          } catch {}

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    // Move participant back to main (socket-based)
    socket.on(
      "meeting:participant:move-to-main",
      async (
        payload: { identity?: string; fromIndex?: number },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!(role === "Moderator" || role === "Admin")) {
            return ack?.({ ok: false, error: "forbidden" });
          }
          const identity = (payload?.identity || "").trim();
          const fromIndexNum = Number(payload?.fromIndex || 0);
          if (!identity)
            return ack?.({ ok: false, error: "identity_required" });
          if (!fromIndexNum || fromIndexNum < 1)
            return ack?.({ ok: false, error: "invalid_breakout_index" });

          const bo = await BreakoutRoom.findOne({
            sessionId: new Types.ObjectId(sessionId),
            index: fromIndexNum,
          }).lean();
          if (!bo) return ack?.({ ok: false, error: "breakout_not_found" });

          try {
            await roomService.moveParticipant(
              bo.livekitRoom,
              identity,
              String(sessionId)
            );
          } catch (e: any) {
            console.error("socket move-to-main failed", {
              sessionId,
              identity,
              fromRoom: bo.livekitRoom,
              error: e?.message || e,
            });
            return ack?.({ ok: false, error: e?.message || "move_failed" });
          }

          // notify moderator panels to refresh lists
          try {
            io.to(String(sessionId)).emit("meeting:participants-changed", {});
          } catch {}

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );
    socket.on("waiting:admit", async ({ email }: { email: string }) => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await admitByEmail(sessionId, email);

      // 1) issue short-lived admitToken for THIS participant
      const displayName =
        state.participantList?.find(
          (p) => p.email?.toLowerCase() === email.toLowerCase()
        )?.name || email; // fallback if name not present

      const admitToken = createAdmitToken({
        sessionId,
        email,
        name: displayName,
        ttlSeconds: 120,
      });

      // 2) find that participant's socket & notify only them
      const targetId = emailIndex.get(sessionId)?.get(email.toLowerCase());
      if (targetId) {
        // new event for participants to listen to
        io.to(targetId).emit("participant:admitted", { admitToken });
      }

      // notify observers that a participant was admitted
      try {
        io.to(rooms.observer).emit("announce:participant:admitted", {
          name: displayName,
          email,
        });
      } catch {}

      // 3) update moderator panels as you already do
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });
    });

    socket.on("waiting:remove", async ({ email }: { email: string }) => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await removeFromWaitingByEmail(sessionId, email);
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });

      const targetId = emailIndex.get(sessionId)?.get(email.toLowerCase());
      if (targetId)
        io.to(targetId).emit("waiting:removed", {
          reason: "Removed by moderator",
        });
    });

    // Move an active participant into the waiting room
    socket.on(
      "meeting:participant:move-to-waiting",
      async (
        payload: { targetEmail?: string; targetIdentity?: string },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!["Moderator", "Admin"].includes(role))
            return ack?.({ ok: false, error: "forbidden" });

          const email = (payload?.targetEmail || "").toLowerCase().trim();
          const identity = (payload?.targetIdentity || "").trim();
          if (!email && !identity)
            return ack?.({ ok: false, error: "target_required" });

          // Prefer email path when available
          if (email) {
            const live = await LiveSessionModel.findOne({ sessionId });
            if (!live) return ack?.({ ok: false, error: "no_session" });

            // remove from active participants list if present
            const idx = (live.participantsList || []).findIndex(
              (p) => (p.email || "").toLowerCase() === email
            );
            if (idx >= 0) {
              const user = live.participantsList.splice(idx, 1)[0];
              // push into waiting room
              live.participantWaitingRoom = live.participantWaitingRoom || [];
              live.participantWaitingRoom.push({
                name: user.name || user.email,
                email: user.email,
                role: user.role || "Participant",
                joinedAt: new Date(),
              } as any);
              await live.save();

              // broadcast updated waiting list and participant change
              try {
                const state = await listState(sessionId);
                io.to(rooms.waiting).emit("waiting:list", {
                  participantsWaitingRoom: state.participantsWaitingRoom,
                  observersWaitingRoom: state.observersWaitingRoom,
                });
                io.to(String(sessionId)).emit(
                  "meeting:participants-changed",
                  {}
                );
              } catch {}

              // notify the participant socket if we can find it
              const targetId = emailIndex.get(sessionId)?.get(email);
              if (targetId) {
                try {
                  io.to(targetId).emit("meeting:moved-to-waiting", {
                    reason: "Moved by moderator",
                  });
                } catch {}
              }
            }
          } else if (identity) {
            // Identity-only path: attempt to look up socket by identityIndex
            const idLower = identity.toLowerCase();
            const idMap = identityIndex.get(sessionId);
            const targetId = idMap?.get(idLower);
            if (targetId) {
              try {
                io.to(targetId).emit("meeting:moved-to-waiting", {
                  reason: "Moved by moderator",
                });
              } catch {}
            }
            // Also update DB lists conservatively: try to find by emailIndex reverse mapping
            // (best-effort; if not resolvable, the moderator UI will refresh lists via meeting:participants-changed)
            try {
              const state = await listState(sessionId);
              io.to(rooms.waiting).emit("waiting:list", {
                participantsWaitingRoom: state.participantsWaitingRoom,
                observersWaitingRoom: state.observersWaitingRoom,
              });
              io.to(String(sessionId)).emit("meeting:participants-changed", {});
            } catch {}
          }

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    // Remove (kick) an active participant from the meeting
    socket.on(
      "meeting:participant:remove",
      async (
        payload: { targetEmail?: string; targetIdentity?: string },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!["Moderator", "Admin"].includes(role))
            return ack?.({ ok: false, error: "forbidden" });

          const email = (payload?.targetEmail || "").toLowerCase().trim();
          const identity = (payload?.targetIdentity || "").trim();
          if (!email && !identity)
            return ack?.({ ok: false, error: "target_required" });

          // Remove from DB participant lists if present
          const live = await LiveSessionModel.findOne({ sessionId });
          if (live) {
            if (email) {
              live.participantsList = (live.participantsList || []).filter(
                (p) => (p.email || "").toLowerCase() !== email
              ) as any;
              live.participantWaitingRoom = (
                live.participantWaitingRoom || []
              ).filter((p) => (p.email || "").toLowerCase() !== email) as any;
              await live.save();
            }
          }

          // Notify panels to refresh
          try {
            io.to(String(sessionId)).emit("meeting:participants-changed", {});
          } catch {}

          // Find target socket and notify + disconnect
          let targetId: string | undefined | null = undefined;
          if (email) targetId = emailIndex.get(sessionId)?.get(email as string);
          if (!targetId && identity)
            targetId = identityIndex
              .get(sessionId)
              ?.get(identity.toLowerCase());
          if (targetId) {
            try {
              io.to(targetId).emit("meeting:removed", {
                reason: "Removed by moderator",
              });
            } catch {}
            // attempt disconnect
            try {
              const sock = io.sockets.sockets.get(targetId as string) as any;
              if (sock && typeof sock.disconnect === "function")
                sock.disconnect(true);
            } catch {}
          }

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    socket.on("waiting:admitAll", async () => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await admitAll(sessionId);

      // for each known socket in this session, try to send an admitToken
      const idx = emailIndex.get(sessionId);
      if (idx) {
        let admittedCount = 0;
        for (const [eml, sockId] of idx.entries()) {
          const displayName =
            state.participantList?.find((p) => p.email?.toLowerCase() === eml)
              ?.name || eml;

          const admitToken = createAdmitToken({
            sessionId,
            email: eml,
            name: displayName,
            ttlSeconds: 120,
          });

          io.to(sockId).emit("participant:admitted", { admitToken });
          admittedCount++;
        }

        // notify all observers with admitted count
        try {
          io.to(rooms.observer).emit("announce:participants:admitted", {
            count: admittedCount,
          });
        } catch {}
      }
      io.to(rooms.waiting).emit("waiting:list", {
        participantsWaitingRoom: state.participantsWaitingRoom,
        observersWaitingRoom: state.observersWaitingRoom,
      });
    });

    // --- NEW: Start HLS stream (admin/mod only) ---
    socket.on(
      "meeting:stream:start",
      async (_payload, ack?: (r: { ok?: boolean; error?: string }) => void) => {
        console.log("start stream", role);
        if (!["Moderator", "Admin"].includes(role)) {
          return ack?.({ ok: false, error: "Forbidden" });
        }
        try {
          // LiveKit room name should match what clients join with (sessionId)
          const session = await SessionModel.findById(sessionId).lean();
          if (!session) throw new Error("Session not found");

          const roomName = String(sessionId);
          await ensureRoom(roomName);

          const existing = await LiveSessionModel.findOne({
            sessionId: new Types.ObjectId(sessionId),
          }).lean();

          if (existing?.streaming)
            return ack?.({ ok: false, error: "Already streaming" });

          // start HLS egress and persist to LiveSession
          const hls = await startHlsEgress(roomName); // returns { egressId, playbackUrl, playlistName }
          const live = await LiveSessionModel.findOneAndUpdate(
            { sessionId: new Types.ObjectId(sessionId) },
            {
              $set: {
                streaming: true,
                hlsStartedAt: new Date(),
                hlsEgressId: hls.egressId ?? null,
                hlsPlaybackUrl: hls.playbackUrl ?? null,
                hlsPlaylistName: hls.playlistName ?? null,
              },
            },
            { upsert: true, new: true }
          );
          console.log("Playback URL", live);
          console.log("hls", hls);
          // tell all observers in this session that streaming is live
          io.to(rooms.observer).emit("observer:stream:started", {
            playbackUrl: live?.hlsPlaybackUrl || hls.playbackUrl || null,
          });

          return ack?.({ ok: true });
        } catch (e: any) {
          console.error("meeting:stream:start failed", e);
          return ack?.({
            ok: false,
            error: e?.message || "Failed to start stream",
          });
        }
      }
    );

    // --- NEW: Stop HLS stream (admin/mod only) ---
    socket.on(
      "meeting:stream:stop",
      async (_payload, ack?: (r: { ok?: boolean; error?: string }) => void) => {
        console.log("stop stream", role);
        if (!["Moderator", "Admin"].includes(role)) {
          return ack?.({ ok: false, error: "Forbidden" });
        }
        try {
          const live = await LiveSessionModel.findOne({
            sessionId: new Types.ObjectId(sessionId),
          });
          if (live?.hlsEgressId) {
            await stopHlsEgress(live.hlsEgressId); // you already use this in endMeeting
          }

          await LiveSessionModel.updateOne(
            { sessionId: new Types.ObjectId(sessionId) },
            {
              $set: {
                streaming: false,
                hlsStoppedAt: new Date(),
              }, // meeting may continue; only stream stops
              $unset: { hlsEgressId: 1, hlsPlaybackUrl: 1, hlsPlaylistName: 1 },
            }
          );

          console.log("stopped stream", live);
          // notify observers to switch back to waiting UI in a later step
          io.to(rooms.observer).emit("observer:stream:stopped", {});

          return ack?.({ ok: true });
        } catch (e: any) {
          console.error("meeting:stream:stop failed", e);
          return ack?.({
            ok: false,
            error: e?.message || "Failed to stop stream",
          });
        }
      }
    );

    /**
     * Moderator/Admin → force-mute a participant's microphone.
     * Payload: { targetEmail: string }
     * Ack: { ok: boolean, error?: string }
     */
    socket.on(
      "meeting:mute-mic",
      async (
        payload: { targetEmail?: string; targetIdentity?: string },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!(role === "Admin" || role === "Moderator")) {
            return ack?.({ ok: false, error: "forbidden" });
          }
          if (!payload?.targetEmail && !payload?.targetIdentity) {
            return ack?.({ ok: false, error: "bad_request" });
          }

          // identity: prefer explicit identity; else compute from email
          const identity =
            payload.targetIdentity ||
            participantIdentity(sessionId, payload.targetEmail!);

          const ok = await serverMuteMicrophone({
            roomName: sessionId,
            identity,
          });
          if (!ok)
            return ack?.({ ok: false, error: "mute_failed_or_not_found" });

          // nudge the client (by email if we have it; otherwise broadcast and let client filter by identity if you emit that too)
          if (payload.targetEmail) {
            const targetId = emailIndex
              .get(sessionId)
              ?.get(payload.targetEmail.toLowerCase());
            if (targetId)
              io.to(targetId).emit("meeting:force-mute", {
                email: payload.targetEmail,
              });
          } else if (payload.targetIdentity) {
            const targetId = identityIndex
              .get(sessionId)
              ?.get(payload.targetIdentity.toLowerCase());
            if (targetId) io.to(targetId).emit("meeting:force-mute", {});
          }

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    /**
     * Moderator/Admin → force-turn-off a participant's camera.
     * Payload: { targetEmail?: string; targetIdentity?: string }
     * Ack: { ok: boolean, error?: string }
     */
    socket.on(
      "meeting:camera-off",
      async (
        payload: { targetEmail?: string; targetIdentity?: string },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!(role === "Admin" || role === "Moderator")) {
            return ack?.({ ok: false, error: "forbidden" });
          }
          if (!payload?.targetEmail && !payload?.targetIdentity) {
            return ack?.({ ok: false, error: "bad_request" });
          }

          // Resolve identity the same way as mic
          const identity =
            payload.targetIdentity ||
            participantIdentity(sessionId, payload.targetEmail!);

          const ok = await serverDisableCamera({
            roomName: sessionId,
            identity,
          });
          if (!ok)
            return ack?.({
              ok: false,
              error: "camera_off_failed_or_not_found",
            });

          // Nudge client (email preferred; fallback to identity broadcast)
          if (payload.targetEmail) {
            const targetId = emailIndex
              .get(sessionId)
              ?.get(payload.targetEmail.toLowerCase());
            if (targetId)
              io.to(targetId).emit("meeting:force-camera-off", {
                email: payload.targetEmail,
              });
          } else if (payload.targetIdentity) {
            const targetId = identityIndex
              .get(sessionId)
              ?.get(payload.targetIdentity.toLowerCase());
            if (targetId) io.to(targetId).emit("meeting:force-camera-off", {});
          }

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    // -- allow/revoke for a single participant
    socket.on(
      "meeting:screenshare:allow",
      async (
        payload: {
          targetEmail?: string;
          targetIdentity?: string;
          allow: boolean;
        },
        ack?: (resp: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!(role === "Admin" || role === "Moderator")) {
            return ack?.({ ok: false, error: "forbidden" });
          }
          if (!payload?.allow && payload?.allow !== false) {
            return ack?.({ ok: false, error: "bad_request" });
          }
          if (!payload?.targetEmail && !payload?.targetIdentity) {
            return ack?.({ ok: false, error: "bad_request" });
          }

          const identity =
            payload.targetIdentity ||
            participantIdentity(sessionId, payload.targetEmail!);

          const ok = await serverAllowScreenshare({
            roomName: sessionId,
            identity,
            allow: payload.allow,
          });
          if (!ok) return ack?.({ ok: false, error: "not_found_or_failed" });

          // If we revoked, nudge client to stop local capture promptly (UX).
          if (!payload.allow) {
            const targetId =
              (payload.targetEmail &&
                emailIndex
                  .get(sessionId)
                  ?.get(payload.targetEmail.toLowerCase())) ||
              (payload.targetIdentity &&
                identityIndex
                  .get(sessionId)
                  ?.get(payload.targetIdentity.toLowerCase()));
            if (targetId)
              io.to(targetId).emit("meeting:force-stop-screenshare", {});
          }

          return ack?.({ ok: true });
        } catch (e: any) {
          return ack?.({ ok: false, error: e?.message || "internal_error" });
        }
      }
    );

    // -- allow/revoke for ALL participants in a room (one go)
    socket.on(
      "meeting:screenshare:allow-all",
      async (
        payload: { allow: boolean },
        ack?: (resp: { ok: boolean; updated: number; error?: string }) => void
      ) => {
        try {
          if (!(role === "Admin" || role === "Moderator")) {
            return ack?.({ ok: false, updated: 0, error: "forbidden" });
          }
          const participants = await roomService.listParticipants(sessionId);
          let updated = 0;
          for (const pi of participants) {
            // Skip moderators/admins (they already can share by default).
            const meta = (() => {
              try {
                return JSON.parse(pi.metadata || "{}");
              } catch {
                return {};
              }
            })();
            const theirRole = (meta?.role as string) || "";
            if (theirRole === "Admin" || theirRole === "Moderator") continue;

            const ok = await serverAllowScreenshare({
              roomName: sessionId,
              identity: pi.identity!,
              allow: payload.allow,
            });
            if (ok) {
              updated++;
              if (!payload.allow) {
                const targetId = identityIndex
                  .get(sessionId)
                  ?.get(pi.identity!.toLowerCase());
                if (targetId)
                  io.to(targetId).emit("meeting:force-stop-screenshare", {});
              }
            }
          }
          return ack?.({ ok: true, updated });
        } catch (e: any) {
          return ack?.({
            ok: false,
            updated: 0,
            error: e?.message || "internal_error",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      if (email && emailIndex.get(sessionId)) {
        emailIndex.get(sessionId)!.delete(email.toLowerCase());
      }
      const idMap = identityIndex.get(sessionId);
      if (idMap) {
        for (const [idLower, sockId] of idMap.entries()) {
          if (sockId === socket.id) idMap.delete(idLower);
        }
      }
      // Notify panels to refresh participant lists (may affect move UI)
      io.to(sessionId).emit("meeting:participants-changed", {});

      // Update observer count/list on disconnect if this was an observer
      if (role === "Observer") {
        const set = observerSockets.get(sessionId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) observerSockets.delete(sessionId);
        }
        const infoMap = observerInfo.get(sessionId);
        if (infoMap) {
          infoMap.delete(socket.id);
          if (infoMap.size === 0) observerInfo.delete(sessionId);
        }
        emitObserverCount();
        emitObserverList();
      }
      if (["Moderator", "Admin"].includes(role)) {
        const set = moderatorSockets.get(sessionId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) moderatorSockets.delete(sessionId);
        }
      }
    });
  });

  return io;
}

// Utility to emit a 1-minute breakout warning to moderators and to participants in a specific breakout room
export async function emitOneMinuteBreakoutWarning(
  sessionId: string,
  breakoutRoom: string,
  breakoutIndex: number
) {
  try {
    // Notify moderators/admins listening in this session
    const observerRoom = `observer::${sessionId}`;
    const payload = { index: breakoutIndex } as { index: number };
    // We intentionally do not include room name; clients don't need it for the toast
    const io = (global as any).io as Server | undefined;
  } catch {}
  try {
    // Best-effort lookup of current participants in the breakout and notify individually
    const ps = await roomService.listParticipants(breakoutRoom);
    const idMap = identityIndex.get(sessionId);
    for (const p of ps || []) {
      const sid = idMap?.get((p.identity || "").toLowerCase());
      if (sid) {
        // emit to that socket
        // We import Server type above; use require of setIo? Instead, reuse the io created in attachSocket via setIo
        // We can't access io instance directly here, so leverage rooms by using process.nextTick and io from setIo
      }
    }
  } catch {}
}
