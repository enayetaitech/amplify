"use client";

import { useEffect, useState } from "react";

type ParticipantInfo = {
  name: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
};

type MeetingSocket = {
  on?: (event: string, cb: (payload?: unknown) => void) => void;
  off?: (event: string, cb: (payload?: unknown) => void) => void;
  emit?: (
    event: string,
    payload: unknown,
    ack?: (response: unknown) => void
  ) => void;
};

export function useSocketParticipantInfo(): Record<string, ParticipantInfo> {
  const [info, setInfo] = useState<Record<string, ParticipantInfo>>({});

  useEffect(() => {
    const sock =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              __meetingSocket?: MeetingSocket;
            }
          ).__meetingSocket || null
        : null;
    if (!sock) return;

    const handleInitial = (resp?: unknown) => {
      try {
        const result = resp as {
          participants?: Array<{
            identity: string;
            name: string;
            email: string;
            role: string;
            firstName: string;
            lastName: string;
          }>;
        };
        if (!Array.isArray(result?.participants)) return;
        const next: Record<string, ParticipantInfo> = {};
        for (const p of result.participants) {
          next[p.identity.toLowerCase()] = {
            name: p.name,
            email: p.email,
            role: p.role,
            firstName: p.firstName || "",
            lastName: p.lastName || "",
          };
        }
        setInfo((prev) => ({ ...prev, ...next }));
      } catch {
        /* ignore */
      }
    };

    if (typeof sock.emit === "function") {
      sock.emit("meeting:get-participants-info", handleInitial);
    }

    const onParticipantInfo = (payload?: unknown) => {
      try {
        const participant = payload as {
          identity?: string;
          name?: string;
          email?: string;
          role?: string;
          firstName?: string;
          lastName?: string;
        };
        if (!participant?.identity || !participant.name) return;
        setInfo((prev) => ({
          ...prev,
          [participant.identity!.toLowerCase()]: {
            name: participant.name!,
            email: participant.email || "",
            role: participant.role || "",
            firstName: participant.firstName || "",
            lastName: participant.lastName || "",
          },
        }));
      } catch {
        /* ignore */
      }
    };

    const onParticipantRemoved = (payload?: unknown) => {
      try {
        const participant = payload as { identity?: string };
        if (!participant?.identity) return;
        setInfo((prev) => {
          const next = { ...prev };
          delete next[participant.identity!.toLowerCase()];
          return next;
        });
      } catch {
        /* ignore */
      }
    };

    if (typeof sock.on === "function") {
      sock.on("meeting:participant-info", onParticipantInfo);
      sock.on("meeting:participant-removed", onParticipantRemoved);
    }

    return () => {
      if (typeof sock.off === "function") {
        sock.off("meeting:participant-info", onParticipantInfo);
        sock.off("meeting:participant-removed", onParticipantRemoved);
      }
    };
  }, []);

  return info;
}

