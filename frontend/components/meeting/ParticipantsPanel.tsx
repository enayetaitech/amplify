"use client";

import { useState } from "react";
import { useParticipants } from "@livekit/components-react";
import { Button } from "components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import {
  MicOff,
  CameraOff,
  ScreenShare,
  ScreenShareOff,
  Mic,
  Camera,
} from "lucide-react";
import { Track } from "livekit-client";
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
  const [shareAllowedOverride, setShareAllowedOverride] = useState<
    Record<string, boolean | undefined>
  >({});
  const all = useParticipants();
  const remotes = all.filter((p) => !p.isLocal);
  const [bulkBusy, setBulkBusy] = useState(false);

  if (!(role === "admin" || role === "moderator")) return null;

  // (bulk function inlined into the single toggle button below)

  // Determine if all remote participants are currently allowed to screenshare
  const allAllowed =
    remotes.length > 0 &&
    remotes.every((p) => {
      const identity = p.identity || "";
      const sources = (p.permissions?.canPublishSources ??
        []) as unknown as Track.Source[];
      const computedAllowed =
        sources.length === 0 ||
        sources.includes(Track.Source.ScreenShare) ||
        sources.includes(Track.Source.ScreenShareAudio);
      const allowed =
        shareAllowedOverride[identity] !== undefined
          ? (shareAllowedOverride[identity] as boolean)
          : computedAllowed;
      return allowed;
    });

  return (
    <div className="my-2 bg-custom-gray-2 rounded-lg p-1 max-h-[40vh] min-h-[40vh] overflow-y-auto">
      <Tabs defaultValue="list">
        <TabsList className="sticky top-0 z-10 bg-custom-gray-2 w-full gap-2">
          <TabsTrigger
            value="list"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Participant List
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-full h-6 px-4 border shadow-sm data-[state=active]:bg-custom-dark-blue-1 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:border-custom-dark-blue-1 data-[state=inactive]:text-custom-dark-blue-1 cursor-pointer"
          >
            Participant Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="font-semibold mb-2">Participants (Live)</div>

          {remotes.length !== 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                onClick={() => {
                  if (!socket || bulkBusy) return;
                  setBulkBusy(true);
                  const next = !allAllowed;
                  socket.emit(
                    "meeting:screenshare:allow-all",
                    { allow: next },
                    (ack: { ok: boolean; updated: number; error?: string }) => {
                      if (!ack?.ok) {
                        console.error(
                          `${
                            next ? "Allow" : "Revoke"
                          } all screenshare failed:`,
                          ack?.error
                        );
                        setBulkBusy(false);
                        return;
                      }
                      setShareAllowedOverride((prev) => {
                        const updated: Record<string, boolean | undefined> = {
                          ...prev,
                        };
                        for (const rp of remotes) {
                          const id = rp.identity || "";
                          if (id) updated[id] = next;
                        }
                        return updated;
                      });
                      setBulkBusy(false);
                    }
                  );
                }}
                disabled={!socket || bulkBusy}
                className="bg-gray-100 hover:bg-gray-200 text-black"
              >
                {allAllowed ? "Revoke all" : "Allow screenshare for all"}
              </Button>
            </div>
          )}

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

              const micPub = p.getTrackPublication
                ? p.getTrackPublication(Track.Source.Microphone)
                : undefined;
              const isMicOn = !!micPub && !micPub.isMuted;
              const camPub = p.getTrackPublication
                ? p.getTrackPublication(Track.Source.Camera)
                : undefined;
              const isCamOn = !!camPub && !camPub.isMuted;

              const isMe = !!myEmail && email === myEmail.toLowerCase();
              const canAct = !isMe && !!socket;
              const canMute = !isMe && !!socket;
              const targetPayload = email
                ? { targetEmail: email }
                : { targetIdentity: identity };

              return (
                <div
                  key={identity}
                  className="flex items-center justify-between gap-2 rounded px-2 py-1"
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Mute mic"
                      title="Mute mic"
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
                      {isMicOn ? (
                        <Mic className="h-4 w-4 text-black font-bold" />
                      ) : (
                        <MicOff className="h-4 w-4 text-custom-orange-1 font-bold" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Turn off camera"
                      title="Turn off camera"
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
                      {isCamOn ? (
                        <Camera className="h-4 w-4 text-black font-bold" />
                      ) : (
                        <CameraOff className="h-4 w-4 text-custom-orange-2 font-bold" />
                      )}
                    </Button>
                    {(() => {
                      const sources = (p.permissions?.canPublishSources ??
                        []) as unknown as Track.Source[];
                      const computedAllowed =
                        sources.length === 0 ||
                        sources.includes(Track.Source.ScreenShare) ||
                        sources.includes(Track.Source.ScreenShareAudio);
                      const allowed =
                        shareAllowedOverride[identity] !== undefined
                          ? (shareAllowedOverride[identity] as boolean)
                          : computedAllowed;
                      return (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!canAct}
                          aria-label={
                            allowed ? "Revoke screenshare" : "Allow screenshare"
                          }
                          title={
                            allowed ? "Revoke screenshare" : "Allow screenshare"
                          }
                          onClick={() => {
                            if (!socket) return;
                            const next = !allowed;
                            socket.emit(
                              "meeting:screenshare:allow",
                              { ...targetPayload, allow: next },
                              (ack: { ok: boolean; error?: string }) => {
                                if (!ack?.ok) {
                                  console.error(
                                    `${
                                      next ? "Allow" : "Revoke"
                                    } screenshare failed:`,
                                    ack?.error
                                  );
                                  return;
                                }
                                setShareAllowedOverride((prev) => ({
                                  ...prev,
                                  [identity]: next,
                                }));
                              }
                            );
                          }}
                        >
                          {allowed ? (
                            <ScreenShareOff className="h-4 w-4 text-custom-orange-1" />
                          ) : (
                            <ScreenShare className="h-4 w-4 text-black" />
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="text-sm text-gray-500">Yet to implement</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
