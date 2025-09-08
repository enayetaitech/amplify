// backend/socket/index.ts
import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
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
import { SessionModel } from "../model/SessionModel";
import { LiveSessionModel } from "../model/LiveSessionModel";

// In-memory map to find a participant socket by email within a session
// sessionId -> (email -> socketId)
const emailIndex = new Map<string, Map<string, string>>();
const identityIndex = new Map<string, Map<string, string>>();

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
        } catch {}
      }
    );

    // ===== Moderator actions =====
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

    socket.on("waiting:admitAll", async () => {
      if (!["Moderator", "Admin"].includes(role)) return;
      const state = await admitAll(sessionId);

      // for each known socket in this session, try to send an admitToken
      const idx = emailIndex.get(sessionId);
      if (idx) {
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
        }
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
    });
  });

  return io;
}
