"use client";

import { useParticipants } from "@livekit/components-react";
import { Button } from "components/ui/button";
import type { Socket } from "socket.io-client";
import type { UiRole } from "constant/roles";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function emailFromIdentity(identity?: string): string | null {
  if (!identity) return null;
  const hit = identity.match(EMAIL_RE);
  return hit ? hit[0].toLowerCase() : null;
}

function emailFromParticipant(p: {
  identity?: string;
  metadata?: string | null;
}) {
  const fromId = emailFromIdentity(p.identity);
  if (fromId) return fromId;
  if (!p?.metadata) return null;
  try {
    const meta = JSON.parse(p.metadata);
    const e = (meta?.email || meta?.userEmail || meta?.e || "").toString();
    return EMAIL_RE.test(e) ? e.toLowerCase() : null;
  } catch {
    return null;
  }
}

export default function ParticipantsPanel({
  role,
  socket,
  myEmail,
}: {
  role: UiRole;
  socket: Socket | null;
  myEmail?: string | null;
}) {
 
  const all = useParticipants();
  const remotes = all.filter((p) => !p.isLocal);

  if (!(role === "admin" || role === "moderator")) return null;

  const bulk = (allow: boolean) => {
    if (!socket) return;
    socket.emit(
      "meeting:screenshare:allow-all",
      { allow },
      (ack: { ok: boolean; updated: number; error?: string }) => {
        if (!ack?.ok) console.error(ack?.error || "Bulk screenshare failed");
      }
    );
  };



  return (
    <div className="my-2 bg-custom-gray-5 rounded-lg p-1">
      <div className="font-semibold mb-2">Participants (Live)</div>

      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          onClick={() => bulk(true)}
          disabled={!socket}
          className="bg-neutral-200 hover:bg-neutral-300 text-black"
        >
          Allow screenshare for all
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => bulk(false)}
          disabled={!socket}
        >
          Revoke all
        </Button>
        {/* Stream controls moved to meeting left sidebar under Whiteboard */}
      </div>

      <div className="space-y-2">
        {remotes.length === 0 && (
          <div className="text-sm text-gray-500">
            No remote participants yet.
          </div>
        )}

        {remotes.map((p) => {
          const identity: string = p.identity || "";
          const name: string = p.name || "";
          const email = emailFromParticipant(p);
          const label = name || email || identity;

          const isMe = !!myEmail && email === myEmail.toLowerCase();
          const canAct = !isMe && !!socket;
          const canMute = !isMe && !!socket;
          const targetPayload = email
            ? { targetEmail: email }
            : { targetIdentity: identity };

          return (
            <div
              key={identity}
              className="flex items-center justify-between gap-2 border rounded px-2 py-1"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{label}</div>
                {email && (
                  <div className="text-[11px] text-gray-500 truncate">
                    {email}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={`px-2 py-1 rounded text-sm ${
                    canMute
                      ? "bg-neutral-200 hover:bg-neutral-300"
                      : "bg-neutral-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canMute}
                  onClick={() => {
                    if (!socket) return;
                    const payload = email
                      ? { targetEmail: email }
                      : { targetIdentity: identity };
                    socket.emit(
                      "meeting:mute-mic",
                      payload,
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error("Mute mic failed:", ack?.error);
                      }
                    );
                  }}
                >
                  Mute mic
                </button>
                <button
                  className={`px-2 py-1 rounded text-sm ${
                    canMute
                      ? "bg-neutral-200 hover:bg-neutral-300"
                      : "bg-neutral-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canMute}
                  onClick={() => {
                    if (!socket) return;
                    const payload = email
                      ? { targetEmail: email }
                      : { targetIdentity: identity };
                    socket.emit(
                      "meeting:camera-off",
                      payload,
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error("Camera off failed:", ack?.error);
                      }
                    );
                  }}
                >
                  Turn off cam
                </button>
                <Button
                  size="sm"
                  className="bg-neutral-200 hover:bg-neutral-300 text-black"
                  disabled={!canAct}
                  onClick={() => {
                    if (!socket) return;
                    socket.emit(
                      "meeting:screenshare:allow",
                      { ...targetPayload, allow: true },
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error(
                            "Allow screenshare failed:",
                            ack?.error
                          );
                      }
                    );
                  }}
                >
                  Allow share
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canAct}
                  onClick={() => {
                    if (!socket) return;
                    socket.emit(
                      "meeting:screenshare:allow",
                      { ...targetPayload, allow: false },
                      (ack: { ok: boolean; error?: string }) => {
                        if (!ack?.ok)
                          console.error(
                            "Revoke screenshare failed:",
                            ack?.error
                          );
                      }
                    );
                  }}
                >
                  Revoke
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
