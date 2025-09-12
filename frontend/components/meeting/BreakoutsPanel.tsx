"use client";

import { useEffect, useMemo, useState } from "react";
import api from "lib/api";
import { Button } from "../ui/button";
import { UiRole } from "../../constant/roles";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../../constant/socket";

type ParticipantItem = { identity: string; name: string };

type BreakoutItem = {
  sessionId: string;
  index: number;
  livekitRoom: string;
  closesAt?: string | Date;
  closedAt?: string | Date;
  hls?: {
    playbackUrl?: string;
    egressId?: string;
    startedAt?: string | Date;
    stoppedAt?: string | Date;
  };
};

export default function BreakoutsPanel({
  sessionId,
  role,
}: {
  sessionId: string;
  role: UiRole;
}) {
  const [creating, setCreating] = useState(false);
  const [breakouts, setBreakouts] = useState<BreakoutItem[]>([]);
  const [sourceRoom, setSourceRoom] = useState<string>("__main__");
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const canManage = role === "admin" || role === "moderator";

  // Poll breakouts
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const load = async () => {
      try {
        const res = await api.get<{ data: { items: BreakoutItem[] } }>(
          `/api/v1/livekit/${sessionId}/breakouts`
        );
        setBreakouts(res.data?.data?.items || []);
      } catch {
        // ignore
      } finally {
        t = setTimeout(load, 3000);
      }
    };
    load();
    return () => {
      if (t) clearTimeout(t);
    };
  }, [sessionId]);

  const roomsList = useMemo(() => {
    const main = { value: "__main__", label: "Main" };
    const bos = breakouts
      .filter((b) => !b.closedAt)
      .map((b) => ({ value: b.livekitRoom, label: `Breakout #${b.index}` }));
    return [main, ...bos];
  }, [breakouts]);

  // Load participants for selected source room
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const params =
          sourceRoom !== "__main__" ? { room: sourceRoom } : undefined;
        const res = await api.get<{ data: { items: ParticipantItem[] } }>(
          `/api/v1/livekit/${sessionId}/participants`,
          { params }
        );
        const items = res.data?.data?.items || [];
        if (!cancelled) setParticipants(items);
      } catch {
        if (!cancelled) setParticipants([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, sourceRoom, refreshTick]);

  // Listen to socket participant changes to refresh the list
  useEffect(() => {
    const existing: Socket | undefined = (
      globalThis as unknown as { __meetingSocket?: Socket }
    ).__meetingSocket;
    let s: Socket | null = existing || null;
    let created = false;
    if (!s) {
      s = io(SOCKET_URL, {
        path: "/socket.io",
        withCredentials: true,
        query: { sessionId },
      });
      created = true;
    }
    const onChanged = () => setRefreshTick((x) => x + 1);
    s.on("meeting:participants-changed", onChanged);
    return () => {
      s?.off("meeting:participants-changed", onChanged);
      if (created) s?.disconnect();
    };
  }, [sessionId]);

  const createBreakout = async () => {
    if (!canManage || creating) return;
    setShowDetails(true);
    setCreating(true);
    try {
      const res = await api.post<{
        data: { index: number; roomName: string; playbackUrl?: string };
      }>(`/api/v1/livekit/${sessionId}/breakouts`);
      const d = res.data?.data;
      toast.success(`Breakout #${d?.index} created`);
      if (d?.index && d?.roomName) {
        setBreakouts((prev) => {
          const next = [
            ...prev,
            {
              sessionId,
              index: d.index,
              livekitRoom: d.roomName,
              hls: d.playbackUrl ? { playbackUrl: d.playbackUrl } : undefined,
            } as BreakoutItem,
          ];
          next.sort((a, b) => a.index - b.index);
          return next;
        });
      }
    } catch {
      toast.error("Failed to create breakout");
    } finally {
      setCreating(false);
    }
  };

  const extend = async (idx: number, minutes: number) => {
    try {
      await api.post(`/api/v1/livekit/${sessionId}/breakouts/${idx}/extend`, {
        addMinutes: minutes,
      });
    } catch {
      toast.error("Failed to extend breakout");
    }
  };

  const close = async (idx: number) => {
    try {
      await api.post(`/api/v1/livekit/${sessionId}/breakouts/${idx}/close`);
      // Optimistically remove from UI immediately
      setBreakouts((prev) => prev.filter((b) => b.index !== idx));
    } catch {
      toast.error("Failed to close breakout");
    }
  };

  const moveToBreakout = async (toIdx: number) => {
    const movedIds = [...selectedIds];
    for (const id of movedIds) {
      try {
        await api.post(`/api/v1/livekit/${sessionId}/breakouts/move-to`, {
          identity: id,
          toIndex: toIdx,
        });
      } catch {
        toast.error(`Failed to move ${id}`);
      }
    }
    setSelectedIds([]);
    // Optimistically remove moved users from current source room list
    setParticipants((prev) =>
      prev.filter((p) => !movedIds.includes(p.identity))
    );
    // Force refresh in case socket is delayed
    setRefreshTick((x) => x + 1);
  };

  const moveToMain = async (fromIdx: number) => {
    const movedIds = [...selectedIds];
    for (const id of movedIds) {
      try {
        await api.post(`/api/v1/livekit/${sessionId}/breakouts/move-back`, {
          identity: id,
          fromIndex: fromIdx,
        });
      } catch {
        toast.error(`Failed to move ${id}`);
      }
    }
    setSelectedIds([]);
    // Optimistically remove moved users from current source room list
    setParticipants((prev) =>
      prev.filter((p) => !movedIds.includes(p.identity))
    );
    // Force refresh in case socket is delayed
    setRefreshTick((x) => x + 1);
  };

  const breakoutIndices = breakouts.map((b) => b.index);
  const selectedIsMain = sourceRoom === "__main__";
  const selectedBreakoutIndex = useMemo(() => {
    if (selectedIsMain) return null;
    const bo = breakouts.find((b) => b.livekitRoom === sourceRoom);
    return bo ? bo.index : null;
  }, [selectedIsMain, sourceRoom, breakouts]);

  if (!canManage) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={createBreakout} disabled={creating}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 "
        >
          {creating ? "Creating…" : "Create Breakout"}
        </Button>
      </div>

      {/* Move participants */}
      {showDetails && (
        <div className="border-t pt-3">
          <div className="font-semibold mb-2">Move participants</div>
          <label className="text-sm">Source room</label>
          <select
            className="block border rounded px-2 py-1 mb-2 text-black w-full"
            value={sourceRoom}
            onChange={(e) => setSourceRoom(e.target.value)}
          >
            {roomsList.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <label className="text-sm w-full">Choose participants</label>
          <select
            multiple
            value={selectedIds}
            onChange={(e) =>
              setSelectedIds(
                Array.from(e.target.selectedOptions)
                  .map((o) => o.value)
                  .filter((v) => participants.some((p) => p.identity === v))
              )
            }
            className="w-full min-h-[90px] border rounded px-2 py-1 text-black"
          >
            {participants.map((p) => (
              <option key={p.identity} value={p.identity}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2 mt-2">
            {!selectedIsMain && selectedBreakoutIndex !== null && (
              <Button
                size="sm"
                onClick={() => moveToMain(selectedBreakoutIndex)}
                disabled={selectedIds.length === 0}
              >
                Move to main
              </Button>
            )}
            {breakoutIndices.map((idx) => {
              const bo = breakouts.find((b) => b.index === idx);
              const isSame = bo?.livekitRoom === sourceRoom;
              if (isSame) return null;
              return (
                <Button
                  key={idx}
                  size="sm"
                  onClick={() => moveToBreakout(idx)}
                  disabled={selectedIds.length === 0}
                >
                  Move to Breakout #{idx}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active list */}
      {showDetails && (
        <div className="border-t pt-3">
          <div className="font-semibold mb-2">Active breakouts</div>
          {breakouts.filter((b) => !b.closedAt).length === 0 && (
            <div className="text-sm text-gray-500">None</div>
          )}
          <div className="space-y-2">
            {breakouts
              .filter((b) => !b.closedAt)
              .map((b) => (
                <div
                  key={b.index}
                  className="flex items-center justify-between gap-2 border rounded p-2"
                >
                  <div>
                    <div className="font-medium">Breakout #{b.index}</div>
                    {b.closesAt ? (
                      <div className="text-xs text-gray-500">
                        Closes at {new Date(b.closesAt).toLocaleTimeString()}
                      </div>
                    ) : null}
                   
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => extend(b.index, 5)}>
                      +5 min
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => close(b.index)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
