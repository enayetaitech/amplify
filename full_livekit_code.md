<!-- Frontend code -->


```javascript
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useRef, useState, useContext } from "react";
import { Room, RoomEvent, DisconnectReason } from "livekit-client";
import {
  RoomContext,
  GridLayout,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import Hls from "hls.js";
import type {
  RemoteParticipant,
  LocalTrackPublication,
  LocalTrack,
} from "livekit-client";
import type {
  Participant,
  TrackPublication,
  LocalParticipant,
} from "livekit-client";
import { Track } from "livekit-client";
import {
  ParticipantPermission,
  TrackSource as ProtoTrackSource,
} from "@livekit/protocol";
import { io, Socket } from "socket.io-client";

type Role = "admin" | "moderator" | "participant" | "observer";

export default function Page() {
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("participant");

  const [connected, setConnected] = useState(false);
  const [hlsLiveUrl, setHlsLiveUrl] = useState<string | null>(null);
  const [room] = useState(
    () => new Room({ adaptiveStream: true, dynacast: true })
  );
  const [wbOpen, setWbOpen] = useState(false);
  const [wbSessionId, setWbSessionId] = useState<string | null>(null);
  // 👇 store the LiveKit token we get from /api/meeting/start|join
  const [lkToken, setLkToken] = useState<string | null>(null);

  // 👇 socket reference (one per meeting)
  const wbSocketRef = useRef<Socket | null>(null);

  const isAdminish = role === "admin" || role === "moderator";

  useEffect(() => {
    return () => {
      try {
        wbSocketRef.current?.disconnect();
      } catch {}
      room.disconnect();
    };
  }, [room]);

  const isLocalParticipant = (p: Participant): p is LocalParticipant =>
    p.isLocal === true;

  useEffect(() => {
    if (!connected) return;
    const lp = room.localParticipant;

    // helper: stop local capture if it's running
    const stopLocalShare = async () => {
      try {
        // If a local screenshare publication exists, force-unpublish it.
        const pub = lp.getTrackPublication(Track.Source.ScreenShare);
        if (pub) {
          await lp.setScreenShareEnabled(false);
        }
        const pubAudio = lp.getTrackPublication(Track.Source.ScreenShareAudio);
        if (pubAudio) {
          await lp.setScreenShareEnabled(false);
        }
      } catch {}
    };

    // 1) If server revokes our ability to publish screenshare, shut it down locally.
    const onPerms = (
      _prev: ParticipantPermission | undefined,
      participant: Participant
    ) => {
      if (!isLocalParticipant(participant)) return;

      const sources = participant.permissions?.canPublishSources ?? [];

      // Per docs: if canPublishSources is empty/undefined, all sources are allowed.
      const allowed =
        sources.length === 0 ||
        sources.includes(ProtoTrackSource.SCREEN_SHARE) ||
        sources.includes(ProtoTrackSource.SCREEN_SHARE_AUDIO);

      if (!allowed) stopLocalShare();
    };

    const onMuted = (
      publication: TrackPublication,
      participant: Participant
    ) => {
      if (!isLocalParticipant(participant)) return;
      const src = publication.source;
      if (
        src === Track.Source.ScreenShare ||
        src === Track.Source.ScreenShareAudio
      ) {
        stopLocalShare();
      }
    };

    room.on(RoomEvent.ParticipantPermissionsChanged, onPerms);
    room.on(RoomEvent.TrackMuted, onMuted);

    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, onPerms);
      room.off(RoomEvent.TrackMuted, onMuted);
    };
  }, [room, connected]);

  // hydrate board when it opens (replay past strokes for current session)
  useEffect(() => {
    if (!wbOpen || !wbSessionId) return;
    let cancelled = false;

    const waitForCanvas = async () => {
      // poll briefly until the canvas registered __wbOnStroke
      for (let i = 0; i < 200; i++) {
        // ~6s worst case
        if ((globalThis as any).__wbReady && (globalThis as any).__wbOnStroke)
          return;
        await new Promise((r) => setTimeout(r, 30));
      }
    };

    (async () => {
      await waitForCanvas();
      if (cancelled) return;
      try {
        const base = `${process.env.NEXT_PUBLIC_API_BASE}/api/wb/history`;

        const u = new URL(base);

        u.searchParams.set("roomName", roomName);
        u.searchParams.set("sessionId", wbSessionId);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();

        if (!cancelled && d?.ok && Array.isArray(d.strokes)) {
          if (d.strokes.length === 0) {
            const u2 = new URL(base);
            u2.searchParams.set("roomName", roomName);
            const r2 = await fetch(u2.toString(), { cache: "no-store" });
            const d2 = await r2.json();
            if (d2?.ok && Array.isArray(d2.strokes)) {
              (globalThis as any).__wbClearLocal?.();
              for (const s of d2.strokes) (globalThis as any).__wbOnStroke?.(s);
              return;
            }
          }
          (globalThis as any).__wbClearLocal?.();
          for (const s of d.strokes) (globalThis as any).__wbOnStroke?.(s);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [wbOpen, roomName, wbSessionId]);

  async function startOrJoin(kind: "start" | "join") {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/meeting/${kind}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, username, role }),
      }
    );
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Request failed");

    // sync role if server modified it
    if (data.role) setRole(data.role);
    if (data.hls?.liveUrl) setHlsLiveUrl(data.hls.liveUrl);

    if (role === "observer") {
      // Observers do not connect to LiveKit; they will just view HLS
      setConnected(true);
      return;
    }

    await room.connect(
      data.wsUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL!,
      data.token
    );
    setLkToken(data.token);
    room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.ROOM_DELETED)
        alert("Meeting ended by host.");
      setConnected(false);
      setHlsLiveUrl(null);
      setWbOpen(false);
      try {
        wbSocketRef.current?.disconnect();
      } catch {}
      wbSocketRef.current = null;
    });

    setConnected(true);
    // 👇 after LiveKit connect, also connect the whiteboard socket
    //     (safe to call multiple times; we guard by ref)
    maybeConnectWhiteboardSocket(roomName, data.token);
  }

  function maybeConnectWhiteboardSocket(roomName: string, token: string) {
    if (wbSocketRef.current || !token) return;

    const s = io(process.env.NEXT_PUBLIC_API_BASE!, {
      path: "/socket.io", // default; change if you mount Socket.IO at a custom path
      transports: ["websocket"],
      query: { roomName, token },
    });

    wbSocketRef.current = s;

    if (!(globalThis as any).__wbQueue) (globalThis as any).__wbQueue = [];
    const q = (globalThis as any).__wbQueue as any[];

    async function waitForCanvasReady() {
      for (let i = 0; i < 100; i++) {
        // ~9s max
        if ((globalThis as any).__wbReady && (globalThis as any).__wbOnStroke)
          return;
        await new Promise((r) => setTimeout(r, 30));
      }
    }

    async function hydrateWhiteboard(roomName: string, sessionId: string) {
      await waitForCanvasReady();
      try {
        const u = new URL(`${process.env.NEXT_PUBLIC_API_BASE}/api/wb/history`);
        u.searchParams.set("roomName", roomName);
        u.searchParams.set("sessionId", sessionId);
        if (sessionId) u.searchParams.set("sessionId", sessionId);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();
        if (d?.ok && Array.isArray(d.strokes)) {
          (globalThis as any).__wbClearLocal?.();
          for (const s of d.strokes) (globalThis as any).__wbOnStroke?.(s);
        }
      } catch {}
    }

    // server pushes whether the board is open + current session id
    s.on("wb:state", (st: { open: boolean; sessionId?: string }) => {
      const sid = typeof st.sessionId === "string" ? st.sessionId : null;

      // set sessionId first so the wbOpen effect sees it
      setWbSessionId(sid);
      setWbOpen(st.open);

      if (st.open && sid) {
        // Ensure React has mounted <WhiteboardCanvas> before hydrating.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            hydrateWhiteboard(roomName, sid);
          });
        });
      }
    });

    s.on("wb:roles", (_roles: string[]) => {
      // could show a UI hint if current role can/can’t draw
    });

    s.on("wb:stroke", (doc: any) => {
      console.log("[wb:stroke]", doc.shape, doc.points?.length, doc); // <— log
      const draw = (globalThis as any).__wbOnStroke;
      if (!draw) {
        q.push(doc); // buffer until canvas mounts
        return;
      }
      draw(doc);
    });

    s.on("wb:refresh", async () => {
      try {
        const base = `${process.env.NEXT_PUBLIC_API_BASE}/api/wb/history`;
        const u = new URL(base);
        u.searchParams.set("roomName", roomName);
        // omit sessionId -> server uses current session
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();
        if (d?.ok && Array.isArray(d.strokes)) {
          (globalThis as any).__wbClearLocal?.();
          for (const s of d.strokes) (globalThis as any).__wbOnStroke?.(s);
        }
      } catch {}
    });

    s.on("connect", () => console.log("[wb] socket connected", s.id));
    s.on("disconnect", (reason) =>
      console.warn("[wb] socket disconnected:", reason)
    );
    s.on("connect_error", (err) =>
      console.error("[wb] connect_error:", err?.message || err)
    );
    s.on("wb:clear", () => (globalThis as any).__wbClearLocal?.());
    s.on("wb:error", (msg: string) => console.warn("[wb:error]", msg));

    // optional: ping/pong latency
    // s.emit("wb:ping");
    // s.on("wb:pong", (ts) => console.log("pong", ts));
  }

  async function endMeeting() {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/meeting/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, role }),
    });
    room.disconnect();
    try {
      wbSocketRef.current?.disconnect();
    } catch {}
    wbSocketRef.current = null;

    setConnected(false);
    setHlsLiveUrl(null);
    setWbOpen(false);
  }

  if (!connected) {
    return (
      <main style={{ padding: 24, maxWidth: 520 }}>
        <h1>LiveKit Meeting (HLS observers + built‑in Whiteboard)</h1>

        <label style={{ display: "block", marginBottom: 4 }}>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          style={{ marginBottom: 12 }}
        >
          <option value="admin">admin</option>
          <option value="moderator">moderator</option>
          <option value="participant">participant</option>
          <option value="observer">observer (HLS view-only)</option>
        </select>

        <input
          className=" border-2 border-gray-300 rounded-md p-2"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <input
          className=" border-2 border-gray-300 rounded-md p-2"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            className="bg-blue-500 text-white rounded-md p-2"
            onClick={() => startOrJoin("start")}
            disabled={!isAdminish}
          >
            Start meeting (admin/mod)
          </button>
          <button
            className="bg-blue-500 text-white rounded-md p-2"
            onClick={() => startOrJoin("join")}
          >
            Join
          </button>
        </div>

        <p style={{ marginTop: 8, color: "#666" }}>
          Admin/moderator can start/end. Participants join as normal. Observers
          don’t appear in the grid and watch the HLS stream.
        </p>
      </main>
    );
  }

  // OBSERVER VIEW: HLS player only (no LiveKit connection)
  if (role === "observer") {
    return (
      <ObserverSelectStream parentRoom={roomName} initialMain={hlsLiveUrl} />
    );
  }

  // ----------------------------------------------------------------
  // Whiteboard open/close actions
  // For admins/moderators we call REST so the server broadcasts to all.
  // Participants simply follow server-pushed wb:state.
  // ----------------------------------------------------------------
  const toggleWhiteboard = async () => {
    if (!lkToken || !wbSocketRef.current) {
      // if someone opens the board immediately after join, make sure we have socket
      if (lkToken) maybeConnectWhiteboardSocket(roomName, lkToken);
    }
    try {
      if (isAdminish) {
        if (!wbOpen) {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/wb/open`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomName, role }),
          });
        } else {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/wb/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomName, role }),
          });
        }
        // state will flip via wb:state broadcast
      } else {
        // non-admins can’t force-open/close; they just follow wb:state
        setWbOpen((v) => v); // no-op
      }
    } catch (e: any) {
      alert(e?.message || "Whiteboard action failed");
    }
  };

  // PARTICIPANT / ADMIN / MODERATOR VIEW: LiveKit grid
  return (
    <RoomContext.Provider value={room}>
      <div
        data-lk-theme="default"
        style={{
          height: "100dvh",
          display: "grid",
          gridTemplateColumns: isAdminish ? "1fr 360px" : "1fr",
        }}
      >
        <div style={{ position: "relative" }}>
          <MyVideoConference />
          <RoomAudioRenderer />

          {/* floating controls */}
          <div
            style={{
              position: "fixed",
              bottom: "calc(var(--lk-control-bar-height) + 12px)",
              left: 16,
              display: "flex",
              gap: 8,
              zIndex: 10,
            }}
          >
            {role === "participant" && (
              <RequestShare
                roomName={roomName}
                username={username}
                onAllowed={() =>
                  alert(
                    "Moderator allowed screen share. Use the Screen Share button to start."
                  )
                }
              />
            )}
            {/* Whiteboard toggle */}
            {isAdminish && (
              <button className="lk-button" onClick={toggleWhiteboard}>
                {wbOpen ? "Close Whiteboard" : "Open Whiteboard"}
              </button>
            )}

            {/* download whiteboard snapshot is inside WB itself */}
          </div>
          {/* Admin/mod can end meeting; no recording buttons */}
          {isAdminish && (
            <div
              style={{
                position: "fixed",
                bottom: "calc(var(--lk-control-bar-height) + 12px)",
                right: 16,
                zIndex: 10,
              }}
            >
              <button
                className="lk-button lk-button-danger"
                onClick={endMeeting}
              >
                End meeting
              </button>
            </div>
          )}

          {/* Whiteboard overlay (no package) */}
          {wbOpen && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 9,
                display: "grid",
                gridTemplateRows: "auto 1fr",
                background: "rgba(0,0,0,0.02)",
                borderTop: "1px solid #eee",
              }}
            >
              <WhiteboardToolbar socketRef={wbSocketRef} />
              <WhiteboardCanvas
                socketRef={wbSocketRef}
                publishFromCanvas={isAdminish}
              />
            </div>
          )}

          <ControlBar />
        </div>
        {isAdminish && (
          <ModeratorPanel room={room} roomName={roomName} role={role} />
        )}
        {isAdminish && (
          <BreakoutsPanel parentRoom={roomName} room={room} role={role} />
        )}
      </div>
    </RoomContext.Provider>
  );
}

function MyVideoConference() {
  // Keep camera placeholders so the grid looks nice when cams are off
  const camRefs = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  // For screen-share: no placeholders, and only include active (non-muted) shares
  const ssAll = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  const ssActive = ssAll.filter((ref) => {
    const pub = ref.publication;
    return !!(pub && pub.isSubscribed && !pub.isMuted && pub.track);
  });

  const tracks = [...camRefs, ...ssActive];

  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}

/* ================= WHITEBOARD (pure canvas + LiveKit data) =================
   Messages:
   { t:'wb:seg', x1,y1,x2,y2, color, size, erase?:boolean }     // draw line
   { t:'wb:clear' }                                             // clear all
   Coords are normalized [0..1] so different canvas sizes stay in sync.
   ======================================================================== */

const enc = new TextEncoder();
const dec = new TextDecoder();

function useWbTools() {
  const [color, setColor] = useState<string>("#111111");
  const [size, setSize] = useState<number>(3);
  const [tool, setTool] = useState<
    "pen" | "eraser" | "line" | "rect" | "circle" | "text"
  >("pen");
  const [text, setText] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(18);
  // expose as a context-ish singleton (since we’re a single file)
  (globalThis as any).__wbTools = { color, size, tool, text, fontSize };
  return {
    color,
    setColor,
    size,
    setSize,
    tool,
    setTool,
    text,
    setText,
    fontSize,
    setFontSize,
  };
}

function WhiteboardToolbar({
  socketRef,
}: {
  socketRef: React.MutableRefObject<Socket | null>;
}) {
  const {
    color,
    setColor,
    size,
    setSize,
    tool,
    setTool,
    text,
    setText,
    fontSize,
    setFontSize,
  } = useWbTools();
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: 8,
        background: "white",
        borderBottom: "1px solid #eee",
        color: "black",
      }}
    >
      <span style={{ fontWeight: 600 }}>Whiteboard</span>
      <label>
        Tool:{" "}
        <select value={tool} onChange={(e) => setTool(e.target.value as any)}>
          <option value="pen">Pen</option>
          <option value="eraser">Eraser</option>
          <option value="line">Line</option>
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="text">Text</option>
        </select>
      </label>
      <label>
        Color:{" "}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <label>
        Size:{" "}
        <input
          type="range"
          min={1}
          max={20}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
      </label>
      {tool === "text" && (
        <>
          <input
            placeholder="Your text…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: 220 }}
          />
          <label>
            Font:{" "}
            <input
              type="range"
              min={10}
              max={64}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </label>
        </>
      )}
      <button
        className="lk-button"
        onClick={() => socketRef.current?.emit("wb:undo")}
      >
        Undo
      </button>
      <button
        className="lk-button"
        onClick={() => socketRef.current?.emit("wb:redo")}
      >
        Redo
      </button>
      <button
        className="lk-button"
        onClick={() => {
          // only admin/mod will be honored by backend
          socketRef.current?.emit("wb:clear");
        }}
      >
        Clear
      </button>
      <button
        className="lk-button"
        onClick={() => {
          const link = document.createElement("a");
          const url = (globalThis as any).__wbToDataURL?.();
          if (!url) return;
          link.href = url;
          link.download = `whiteboard-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
      >
        Download PNG
      </button>
    </div>
  );
}

function WhiteboardCanvas({
  socketRef,
  publishFromCanvas,
}: {
  socketRef: React.MutableRefObject<Socket | null>;
  publishFromCanvas: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDown, setIsDown] = useState(false);
  const isDownRef = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [textEditor, setTextEditor] = useState<null | {
    left: number; // CSS px relative to canvas
    top: number; // CSS px relative to canvas
    nx: number; // normalized x (0..1)
    ny: number; // normalized y (0..1)
    value: string;
  }>(null);

  function getTools() {
    const t = (globalThis as any).__wbTools || {};
    return {
      color: t.color ?? "#111",
      size: Number(t.size ?? 3),
      fontSize: Math.max(10, Number(t.fontSize ?? 18)),
    };
  }

  function openTextEditorAt(clientX: number, clientY: number) {
    const cvs = canvasRef.current!;
    const rect = cvs.getBoundingClientRect();
    const left = clientX - rect.left;
    const top = clientY - rect.top;
    const nx = left / rect.width;
    const ny = top / rect.height;

    setTextEditor({ left, top, nx, ny, value: "" });
    // focus next tick so iOS/Chrome reliably open the keyboard
    setTimeout(() => textAreaRef.current?.focus(), 0);
  }

  function commitText() {
    if (!textEditor) return;
    const val = (textEditor.value || "").trim();
    const { color, size, fontSize } = getTools();
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const rect = cvs.getBoundingClientRect();

    if (val) {
      // Draw locally (supports multi-line)
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = "top";

      const lines = val.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(
          lines[i],
          textEditor.left,
          textEditor.top + i * fontSize * 1.2
        );
      }
      ctx.restore();

      // Emit to everyone else using normalized origin point
      socketRef.current?.emit("wb:stroke", {
        tool: "pen",
        shape: "text",
        color,
        fontSize,
        size,
        text: val,
        points: [{ x: textEditor.nx, y: textEditor.ny }],
      });
    }

    setTextEditor(null);
  }

  const lkRoom = useContext(RoomContext);

  const publishedRef = useRef<LocalTrackPublication | null>(null);
  const keepAliveRef = useRef<number | null>(null);
  // expose helpers for toolbar and socket listeners

  useEffect(() => {
    (globalThis as any).__wbReady = true;
    (globalThis as any).__wbClearLocal = () => {
      const cvs = canvasRef.current!;
      const ctx = cvs.getContext("2d")!;
      // Fill opaque white so captured video isn't transparent/black
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cvs.clientWidth, cvs.clientHeight);
      ctx.restore();
    };

    // Initialize with a white background
    (globalThis as any).__wbClearLocal?.();

    (globalThis as any).__wbToDataURL = () => {
      const cvs = canvasRef.current!;
      return cvs.toDataURL("image/png");
    };
    (globalThis as any).__wbOnStroke = (doc: any) => {
      const cvs = canvasRef.current!;
      if (!cvs) return;
      const ctx = cvs.getContext("2d")!;
      const w = cvs.clientWidth,
        h = cvs.clientHeight;

      const pts = (doc?.points || []).map((p: any) => ({
        x: p.x * w,
        y: p.y * h,
      }));
      if (pts.length === 0) return;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const isErase = doc.tool === "eraser";
      const color = isErase ? "#ffffff" : doc.color || "#111";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = Math.max(1, Number(doc.size) || 3);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const shape = doc.shape || "free";

      if (shape === "text") {
        const p = pts[0];
        const fs = Math.max(10, Number(doc.fontSize || 18));
        ctx.font = `${fs}px sans-serif`;
        ctx.textBaseline = "top";
        const lines = String(doc.text || "").split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], p.x, p.y + i * fs * 1.2);
        }
      } else if (shape === "line") {
        if (pts.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        }
      } else if (shape === "rect") {
        if (pts.length >= 2) {
          const x1 = pts[0].x,
            y1 = pts[0].y;
          const x2 = pts[pts.length - 1].x,
            y2 = pts[pts.length - 1].y;
          ctx.strokeRect(
            Math.min(x1, x2),
            Math.min(y1, y2),
            Math.abs(x2 - x1),
            Math.abs(y2 - y1)
          );
        }
      } else if (shape === "circle") {
        if (pts.length >= 2) {
          const x1 = pts[0].x,
            y1 = pts[0].y;
          const x2 = pts[pts.length - 1].x,
            y2 = pts[pts.length - 1].y;
          const cx = (x1 + x2) / 2,
            cy = (y1 + y2) / 2;
          const rx = Math.abs(x2 - x1) / 2;
          const ry = Math.abs(y2 - y1) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // 'free' (pen/eraser)
        if (pts.length === 1) {
          const r = ctx.lineWidth / 2;
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const q = (globalThis as any).__wbQueue as any[] | undefined;
    if (q?.length) {
      for (const doc of q) (globalThis as any).__wbOnStroke(doc);
      q.length = 0;
    }

    (globalThis as any).__wbQueue = q || [];

    return () => {
      (globalThis as any).__wbReady = false;
    };
  }, []);

  // canvas resize
  useEffect(() => {
  const cvs = canvasRef.current!;
  const parent = cvs.parentElement!;
  let initialized = false;

  const resize = () => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = parent.clientWidth;
    const h = parent.clientHeight;

    // snapshot current pixels (device resolution)
    const prevW = cvs.width;
    const prevH = cvs.height;
    let prevCanvas: HTMLCanvasElement | null = null;
    if (prevW > 0 && prevH > 0) {
      prevCanvas = document.createElement("canvas");
      prevCanvas.width = prevW;
      prevCanvas.height = prevH;
      const pctx = prevCanvas.getContext("2d")!;
      pctx.drawImage(cvs, 0, 0);
    }

    const newW = Math.floor(w * dpr);
    const newH = Math.floor(h * dpr);
    if (newW === prevW && newH === prevH) return;

    cvs.width = newW;
    cvs.height = newH;
    cvs.style.width = `${w}px`;
    cvs.style.height = `${h}px`;

    const ctx = cvs.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    if (!initialized) {
      // paint a white background only once
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      initialized = true;
    } else if (prevCanvas) {
      // redraw the previous bitmap scaled to new CSS size
      // NOTE: after ctx.scale(dpr,dpr), coordinates are in CSS px
      ctx.drawImage(prevCanvas, 0, 0, prevW, prevH, 0, 0, w, h);
    }
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  return () => ro.disconnect();
}, []);

  const norm = useCallback((e: PointerEvent) => {
    const cvs = canvasRef.current!;
    const rect = cvs.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, nx: x / rect.width, ny: y / rect.height };
  }, []);

  // pointer drawing -> emit wb:stroke (free) or one-shot shapes/text
  useEffect(() => {
    const cvs = canvasRef.current!;

    let batch: { x: number; y: number }[] = [];
    let flushTimer: any = null;
    let lastNorm: { x: number; y: number } | null = null;
    let startNorm: { x: number; y: number } | null = null;
    let snapshot: ImageData | null = null; // for shape preview

    const flush = () => {
      if (!batch.length) return;
      const tools = (globalThis as any).__wbTools || {
        color: "#111",
        size: 3,
        tool: "pen",
        text: "",
        fontSize: 18,
      };
      socketRef.current?.emit("wb:stroke", {
        tool: tools.tool === "eraser" ? "eraser" : "pen",
        shape: "free",
        color: tools.color,
        size: tools.size,
        points: batch,
      });
      batch = lastNorm ? [lastNorm] : [];
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      cvs.setPointerCapture(e.pointerId);
      setIsDown(true);
      isDownRef.current = true;
      lastPt.current = null;

      const tools = (globalThis as any).__wbTools || { tool: "pen" };

      if (tools.tool === "text") {
        openTextEditorAt(e.clientX, e.clientY);
        return;
      }

      const { nx, ny } = norm(e);
      startNorm = { x: nx, y: ny };

      if (tools.tool === "pen" || tools.tool === "eraser") {
        lastNorm = { x: nx, y: ny };
        batch = [lastNorm];
      } else {
        const ctx = cvs.getContext("2d")!;
        snapshot = ctx.getImageData(0, 0, cvs.width, cvs.height);
      }
    };

    const onUp = (e: PointerEvent) => {
      e.preventDefault();
      const tools = (globalThis as any).__wbTools || {
        tool: "pen",
        color: "#111",
        size: 3,
        text: "",
        fontSize: 18,
      };

      // ⬇️ NEW: text tool is handled by inline editor; nothing to do here
      if (tools.tool === "text") return;
      try {
        cvs.releasePointerCapture(e.pointerId);
      } catch {}
      setIsDown(false);
      isDownRef.current = false;
      // const tools = (globalThis as any).__wbTools || {
      //   tool: "pen",
      //   color: "#111",
      //   size: 3,
      //   text: "",
      //   fontSize: 18,
      // };
      const { nx, ny } = norm(e);
      const endNorm = { x: nx, y: ny };

      if (tools.tool === "pen" || tools.tool === "eraser") {
        lastPt.current = null;
        flush();
      } else if (tools.tool === "text") {
        if (!tools.text?.trim()) return;
        // draw locally
        const ctx = cvs.getContext("2d")!;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = tools.color;
        ctx.font = `${Math.max(10, tools.fontSize)}px sans-serif`;
        ctx.textBaseline = "top";
        const rect = cvs.getBoundingClientRect();
        ctx.fillText(
          tools.text,
          endNorm.x * rect.width,
          endNorm.y * rect.height
        );
        ctx.restore();
        // emit once
        socketRef.current?.emit("wb:stroke", {
          tool: "pen",
          shape: "text",
          color: tools.color,
          fontSize: tools.fontSize,
          size: tools.size,
          text: tools.text,
          points: [endNorm],
        });
      } else {
        // finalize shape (line/rect/circle)
        if (!startNorm) return;
        const ctx = cvs.getContext("2d")!;
        if (snapshot) ctx.putImageData(snapshot, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = tools.color;
        ctx.lineWidth = tools.size;
        const rect = cvs.getBoundingClientRect();
        const x1 = startNorm.x * rect.width,
          y1 = startNorm.y * rect.height;
        const x2 = endNorm.x * rect.width,
          y2 = endNorm.y * rect.height;
        if (tools.tool === "line") {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        } else if (tools.tool === "rect") {
          ctx.strokeRect(
            Math.min(x1, x2),
            Math.min(y1, y2),
            Math.abs(x2 - x1),
            Math.abs(y2 - y1)
          );
        } else {
          const cx = (x1 + x2) / 2,
            cy = (y1 + y2) / 2,
            rx = Math.abs(x2 - x1) / 2,
            ry = Math.abs(y2 - y1) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        socketRef.current?.emit("wb:stroke", {
          tool: "pen",
          shape:
            tools.tool === "line"
              ? "line"
              : tools.tool === "rect"
              ? "rect"
              : "circle",
          color: tools.color,
          size: tools.size,
          points: [startNorm, endNorm],
        });
        snapshot = null;
      }
      // reset batching vars
      startNorm = null;
      lastNorm = null;
      batch = [];
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!isDownRef.current) return;
      const { x, y, nx, ny } = norm(e);
      const tools = (globalThis as any).__wbTools || {
        tool: "pen",
        color: "#111",
        size: 3,
      };
      const ctx = cvs.getContext("2d")!;

      if (tools.tool === "pen" || tools.tool === "eraser") {
        // local draw for pen/eraser
        if (lastPt.current) {
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = tools.tool === "eraser" ? "#ffffff" : tools.color;
          ctx.lineWidth = tools.size;
          ctx.beginPath();
          ctx.moveTo(lastPt.current.x, lastPt.current.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.restore();
        }
        lastPt.current = { x, y };
        lastNorm = { x: nx, y: ny };
        batch.push(lastNorm);
        if (!flushTimer) {
          flushTimer = setTimeout(() => {
            flush();
            flushTimer = null;
          }, 50);
        }
      } else if (
        tools.tool === "line" ||
        tools.tool === "rect" ||
        tools.tool === "circle"
      ) {
        // preview shape using snapshot
        if (!snapshot || !startNorm) return;
        ctx.putImageData(snapshot, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = tools.color;
        ctx.lineWidth = tools.size;
        const rect = cvs.getBoundingClientRect();
        const x1 = startNorm.x * rect.width,
          y1 = startNorm.y * rect.height;
        const x2 = nx * rect.width,
          y2 = ny * rect.height;
        if (tools.tool === "line") {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        } else if (tools.tool === "rect") {
          ctx.strokeRect(
            Math.min(x1, x2),
            Math.min(y1, y2),
            Math.abs(x2 - x1),
            Math.abs(y2 - y1)
          );
        } else {
          const cx = (x1 + x2) / 2,
            cy = (y1 + y2) / 2,
            rx = Math.abs(x2 - x1) / 2,
            ry = Math.abs(y2 - y1) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    cvs.addEventListener("pointerdown", onDown);
    cvs.addEventListener("pointerup", onUp);
    cvs.addEventListener("pointercancel", onUp);
    cvs.addEventListener("pointerleave", onUp);
    cvs.addEventListener("pointermove", onMove);
    return () => {
      cvs.removeEventListener("pointerdown", onDown);
      cvs.removeEventListener("pointerup", onUp);
      cvs.removeEventListener("pointercancel", onUp);
      cvs.removeEventListener("pointerleave", onUp);
      cvs.removeEventListener("pointermove", onMove);
    };
  }, [socketRef, norm]);

  useEffect(() => {
    if (!publishFromCanvas || !lkRoom) return;
    const cvs = canvasRef.current;
    if (!cvs) return;

    // 30fps canvas capture
    const stream = cvs.captureStream(30);
    const vtrack = stream.getVideoTracks()[0];
    if (!vtrack) return;
    try {
      (vtrack as any).contentHint = "detail";
    } catch {}

    let cancelled = false;
    (async () => {
      try {
        const pub = await lkRoom.localParticipant.publishTrack(vtrack, {
          source: Track.Source.ScreenShare,
          name: "Whiteboard",
        });
        if (!cancelled) publishedRef.current = pub;
        const ctx = cvs.getContext("2d")!;
        let toggle = false;
        keepAliveRef.current = window.setInterval(() => {
          // draw a 1px “heartbeat” in the bottom-right corner.
          // toggle between two whites so browsers treat it as a change.
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          const px = cvs.clientWidth - 1,
            py = cvs.clientHeight - 1;
          ctx.fillStyle = toggle ? "#ffffff" : "#fefefe";
          ctx.fillRect(px, py, 1, 1);
          ctx.restore();
          toggle = !toggle;
        }, 1000); // 1 fps is plenty
      } catch (e) {
        // Publishing can fail if permissions change; safe to ignore here.
        console.warn("[wb] publish failed:", (e as any)?.message || e);
        try {
          vtrack.stop();
        } catch {}
      }
    })();

    return () => {
      cancelled = true;
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      const pub = publishedRef.current;
      publishedRef.current = null;
      if (!lkRoom) return;
      if (pub) {
        const t = pub.track as LocalTrack | undefined;
        if (t) {
          try {
            lkRoom.localParticipant.unpublishTrack(t);
          } catch {}
          try {
            t.stop();
          } catch {}
        }
      }

      try {
        lkRoom.localParticipant.setScreenShareEnabled(false);
      } catch {}
    };
  }, [publishFromCanvas, lkRoom]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "crosshair",
          touchAction: "none",
          background: "white",
        }}
      />
      {textEditor && (
        <textarea
          ref={textAreaRef}
          value={textEditor.value}
          onChange={(e) =>
            setTextEditor((t) => (t ? { ...t, value: e.target.value } : t))
          }
          onKeyDown={(e) => {
            // Enter = commit, Shift+Enter = new line, Esc = cancel
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitText();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setTextEditor(null);
            }
          }}
          onBlur={commitText}
          style={{
            position: "absolute",
            left: textEditor.left,
            top: textEditor.top,
            minWidth: 160,
            maxWidth: "80%",
            color: getTools().color,
            font: `${getTools().fontSize}px sans-serif`,
            lineHeight: 1.2,
            padding: 0,
            margin: 0,
            border: "1px dashed #888",
            outline: "none",
            background: "rgba(255,255,255,0.9)",
            resize: "both",
            zIndex: 11, // above canvas & toolbar
          }}
          rows={1}
        />
      )}
    </div>
  );
}

function RequestShare({
  roomName,
  username,
  onAllowed,
}: {
  roomName: string;
  username: string;
  onAllowed: () => void;
}) {
  type Status = "idle" | "waiting" | "denied" | "allowed";
  const [status, setStatus] = useState<Status>("idle");

  // poll for status while waiting
  useEffect(() => {
    if (status !== "waiting") return;
    let t: any;

    const tick = async () => {
      try {
        const u = new URL(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/participant/share-status`
        );
        u.searchParams.set("roomName", roomName);
        u.searchParams.set("identity", username);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();

        if (d.ok) {
          if (d.canShare) {
            setStatus("allowed");
            onAllowed();
            return;
          }
          if (!d.pending && d.decision === "denied") {
            setStatus("denied"); // <-- stop showing "waiting"
            return;
          }
        }
      } catch {}

      t = setTimeout(tick, 2000);
    };

    tick();
    return () => clearTimeout(t);
  }, [status, roomName, username, onAllowed]);

  const request = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/mod/screenshare/request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, identity: username, name: username }),
      }
    );
    setStatus("waiting");
  };

  if (status === "allowed") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(var(--lk-control-bar-height) + 60px)",
        left: 16,
        zIndex: 10,
      }}
    >
      {status === "idle" && (
        <button className="lk-button" onClick={request}>
          Request screen share
        </button>
      )}
      {status === "waiting" && <span>Waiting for moderator approval…</span>}
      {status === "denied" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Request denied.</span>
          <button className="lk-button" onClick={request}>
            Request again
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Moderator Panel ----------
function ModeratorPanel({
  room,
  roomName,
  role,
}: {
  room: Room;
  roomName: string;
  role: Role;
}) {
  const [list, setList] = useState<RemoteParticipant[]>([]);
  const [requests, setRequests] = useState<
    Array<{ identity: string; name: string; at: number }>
  >([]);

  useEffect(() => {
    const resync = () => {
      const all = Array.from(room.remoteParticipants.values());
      const humans = all.filter((p: any) => {
        const k = p.kind ?? "standard";
        const isStandard = typeof k === "string" ? k === "standard" : k === 0;
        const isHidden = !!p.permissions?.hidden;
        return isStandard && !isHidden;
      });
      setList(humans);
    };
    resync();
    room.on(RoomEvent.ParticipantConnected, resync);
    room.on(RoomEvent.ParticipantDisconnected, resync);
    room.on(RoomEvent.TrackPublished, resync);
    room.on(RoomEvent.TrackUnpublished, resync);
    return () => {
      room.off(RoomEvent.ParticipantConnected, resync);
      room.off(RoomEvent.ParticipantDisconnected, resync);
      room.off(RoomEvent.TrackPublished, resync);
      room.off(RoomEvent.TrackUnpublished, resync);
    };
  }, [room]);

  // poll pending requests every 2s
  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const u = new URL(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/mod/screenshare/pending`
        );
        u.searchParams.set("roomName", roomName);
        u.searchParams.set("role", role);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();
        if (d.ok) setRequests(d.items || []);
      } catch {}
      t = setTimeout(tick, 2000);
    };
    tick();
    return () => clearTimeout(t);
  }, [roomName, role]);

  async function post(path: string, body: any) {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  const mute = (
    identity: string,
    kind: "audio" | "video" | "screenshare",
    mute = true
  ) => post("/api/mod/mute", { roomName, role, identity, kind, mute });

  const allowSS = (identity: string, allow: boolean) =>
    post("/api/mod/screenshare/decide", { roomName, role, identity, allow });

  return (
    <aside
      style={{ borderLeft: "1px solid #e5e5e5", padding: 12, overflow: "auto" }}
    >
      <h3>Participants</h3>
      {list.length === 0 && <p>No one else yet.</p>}
      {list.map((p) => (
        <div
          key={p.identity}
          style={{
            padding: 8,
            border: "1px solid #eee",
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 600 }}>{p.name || p.identity}</div>
          <div
            style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}
          >
            <button
              className="lk-button"
              onClick={() => mute(p.identity, "audio", true)}
            >
              Mute mic
            </button>
            <button
              className="lk-button"
              onClick={() => mute(p.identity, "video", true)}
            >
              Turn off camera
            </button>
            <button
              className="lk-button"
              onClick={() => mute(p.identity, "screenshare", true)}
            >
              Stop screenshare
            </button>
            <button
              className="lk-button"
              onClick={() => allowSS(p.identity, true)}
            >
              Allow screenshare
            </button>
            <button
              className="lk-button lk-button-danger"
              onClick={() => allowSS(p.identity, false)}
            >
              Deny screenshare
            </button>
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: 16 }}>Screen-share requests</h3>
      {requests.length === 0 && <p>No pending requests.</p>}
      {requests.map((r) => (
        <div
          key={r.identity}
          style={{
            padding: 8,
            border: "1px dashed #bbb",
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <div>
            <b>{r.name}</b> ({r.identity})
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              className="lk-button"
              onClick={() => allowSS(r.identity, true)}
            >
              Allow
            </button>
            <button
              className="lk-button lk-button-danger"
              onClick={() => allowSS(r.identity, false)}
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}

function BreakoutsPanel({
  parentRoom,
  room,
  role,
}: {
  parentRoom: string;
  room: Room;
  role: Role;
}) {
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState<number>(10);
  const [creating, setCreating] = useState(false);

  const [state, setState] = useState<{
    main?: any;
    breakouts: Array<{ roomName: string; hls?: any; endAt?: number }>;
  }>({ breakouts: [] });

  const [sourceRoom, setSourceRoom] = useState<string>(parentRoom);
  const [participants, setParticipants] = useState<
    Array<{ identity: string; name: string }>
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  // poll breakout state
  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const u = new URL(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/breakouts/state`
        );
        u.searchParams.set("parentRoom", parentRoom);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();
        if (d.ok) setState({ main: d.main, breakouts: d.breakouts });
      } catch {}
      t = setTimeout(tick, 2500);
    };
    tick();
    return () => clearTimeout(t);
  }, [parentRoom]);

  // local clock for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // load participants of selected source room
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const u = new URL(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/room/participants`
        );
        u.searchParams.set("roomName", sourceRoom);
        u.searchParams.set("role", role);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();
        if (!ignore && d.ok) setParticipants(d.items || []);
      } catch {}
    };
    load();
    return () => {
      ignore = true;
    };
  }, [sourceRoom, role]);

  const createBreakout = async () => {
    // allow click even if label empty -> generate a fallback
    const safeLabel =
      label.trim() ||
      `group-${new Date().toISOString().slice(11, 16).replace(":", "")}`; // e.g. group-13-45

    setCreating(true);
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/breakouts/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentRoom,
            label: safeLabel,
            role,
            durationMinutes: Number(duration) || 0,
          }),
        }
      );
      const d = await resp.json();
      if (!resp.ok) throw new Error(d.error || "Failed to create breakout");
      setLabel(""); // reset input
    } catch (e: any) {
      alert(e?.message || "Failed to create breakout");
    } finally {
      setCreating(false);
    }
  };

  const closeBreakout = async (bo: string) => {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/breakouts/close`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentRoom, breakout: bo, role }),
      }
    );
    const d = await resp.json();
    if (!resp.ok) alert(d.error || "Failed to close breakout");
  };

  const extendBreakout = async (bo: string, minutes = 5) => {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/breakouts/extend`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentRoom,
          breakout: bo,
          role,
          addMinutes: minutes,
        }),
      }
    );
    const d = await resp.json();
    if (!resp.ok) alert(d.error || "Failed to extend breakout");
  };

  const moveTo = async (toRoom: string) => {
    for (const id of selected) {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/breakouts/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromRoom: sourceRoom,
            identity: id,
            toRoom,
            role,
          }),
        }
      );
      const d = await resp.json();
      if (!resp.ok) alert(d.error || `Failed to move ${id}`);
    }
    setSelected([]);
  };

  const roomsList = [parentRoom, ...state.breakouts.map((b) => b.roomName)];
  const breakoutsOnly = state.breakouts.map((b) => b.roomName);

  const canMove = selected.length > 0;
  const thereAreBreakouts = breakoutsOnly.length > 0;

  return (
    <aside
      style={{ borderLeft: "1px solid #e5e5e5", padding: 12, overflow: "auto" }}
    >
      <h3>Breakouts</h3>

      <div style={{ display: "grid", gap: 8 }}>
        {/* Create */}
        <div>
          <input
            placeholder="New breakout label"
            value={label}
            className="text-black"
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={0}
            className="border border-gray-300 rounded-md p-2 text-black"
            style={{ width: 90, marginLeft: 6 }}
            title="Duration in minutes (0 = no timer)"
          />
          <button
            className="lk-button"
            onClick={createBreakout}
            disabled={creating}
            title={
              label.trim() ? "" : "Will auto-generate a name if left blank"
            }
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        {/* Move participants — only if there is somewhere to move */}
        {thereAreBreakouts && (
          <div style={{ borderTop: "1px solid #eee", paddingTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Move participants
            </div>

            <label className="text-black">Source room</label>
            <select
              className="text-black"
              value={sourceRoom}
              onChange={(e) => setSourceRoom(e.target.value)}
              style={{ display: "block", marginBottom: 6 }}
            >
              {roomsList.map((r) => (
                <option key={r} value={r}>
                  {r === parentRoom ? `${r} (main)` : r}
                </option>
              ))}
            </select>

            <label className="text-black">Choose participants</label>
            <select
              multiple
              value={selected}
              onChange={(e) =>
                setSelected(
                  Array.from(e.target.selectedOptions).map((o) => o.value)
                )
              }
              style={{ width: "100%", minHeight: 90, marginBottom: 8 }}
              className="text-black"
            >
              {participants.map((p) => (
                <option key={p.identity} value={p.identity}>
                  {p.name}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {/* Only show Move to main when the source is NOT the main */}
              {sourceRoom !== parentRoom && (
                <button
                  className="lk-button"
                  disabled={!canMove}
                  onClick={() => moveTo(parentRoom)}
                >
                  Move to main
                </button>
              )}
              {breakoutsOnly.map(
                (bo) =>
                  // Hide the button to move to the SAME room you’re already viewing
                  bo !== sourceRoom && (
                    <button
                      key={bo}
                      className="lk-button"
                      disabled={!canMove}
                      onClick={() => moveTo(bo)}
                    >
                      Move to {breakoutLabelFromName(parentRoom, bo)}
                    </button>
                  )
              )}
            </div>
          </div>
        )}

        {/* Active list */}
        <div style={{ borderTop: "1px solid #eee", paddingTop: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Active breakouts
          </div>
          {state.breakouts.length === 0 && <p>None</p>}
          {state.breakouts.map((b) => {
            const label = breakoutLabelFromName(parentRoom, b.roomName);
            const remaining =
              typeof b.endAt === "number" && b.endAt > now
                ? Math.max(0, Math.floor((b.endAt - now) / 1000))
                : null;
            return (
              <div
                key={b.roomName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: 6,
                  border: "1px solid #eee",
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  {remaining !== null && (
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Auto-closes in {Math.floor(remaining / 60)}:
                      {String(remaining % 60).padStart(2, "0")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <a
                    className="lk-button"
                    href={b.hls?.liveUrl || "#"}
                    target="_blank"
                  >
                    Open HLS
                  </a>
                  <button
                    className="lk-button"
                    onClick={() => extendBreakout(b.roomName, 5)}
                  >
                    +5 min
                  </button>
                  <button
                    className="lk-button lk-button-danger"
                    onClick={() => closeBreakout(b.roomName)}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ---------- Observer: show all streams ----------
function ObserverSelectStream({
  parentRoom,
  initialMain,
}: {
  parentRoom: string;
  initialMain: string | null;
}) {
  const [state, setState] = useState<{ main?: any; breakouts: any[] }>({
    breakouts: [],
  });
  const [selected, setSelected] = useState<string>("__main__"); // key: __main__ or actual roomName
  const [url, setUrl] = useState<string | null>(initialMain);

  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const u = new URL(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/breakouts/state`
        );
        u.searchParams.set("parentRoom", parentRoom);
        const r = await fetch(u.toString(), { cache: "no-store" });
        const d = await r.json();
        if (d.ok) setState({ main: d.main, breakouts: d.breakouts });
      } catch {}
      t = setTimeout(tick, 3000);
    };
    tick();
    return () => clearTimeout(t);
  }, [parentRoom]);

  // update URL when selection changes or state changes
  useEffect(() => {
    if (selected === "__main__") {
      setUrl(state.main?.liveUrl || initialMain || null);
    } else {
      const bo = state.breakouts.find((b) => b.roomName === selected);
      setUrl(bo?.liveUrl || null);
    }
  }, [selected, state, initialMain]);

  const options = [
    { value: "__main__", label: `${parentRoom} (main)` },
    ...state.breakouts.map((b: any) => ({
      value: b.roomName,
      label: breakoutLabelFromName(parentRoom, b.roomName),
    })),
  ];

  return (
    <main style={{ padding: 16 }}>
      <h2>Observer</h2>
      <label style={{ display: "block", marginBottom: 6 }}>Choose a room</label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{ marginBottom: 12 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <HlsPlayer src={url} />
    </main>
  );
}

function breakoutLabelFromName(parent: string, full: string) {
  const prefix = `${parent}__bo__`;
  return full.startsWith(prefix) ? full.slice(prefix.length) : full;
}

// Minimal HLS player (works in Chrome/Firefox via hls.js; Safari plays HLS natively)
function HlsPlayer({ src }: { src: string | null }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!src || !ref.current) return;
    const video = ref.current;

    const ping = async () => {
      for (let i = 0; i < 10; i++) {
        try {
          const r = await fetch(src, { method: "HEAD", cache: "no-store" });
          if (r.ok) return true;
        } catch {}
        await new Promise((r) => setTimeout(r, 1000));
      }
      return false;
    };

    (async () => {
      await ping();
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        try {
          await video.play();
        } catch {}
        return;
      }
      if (Hls.isSupported()) {
        const hls = new Hls({
          liveDurationInfinity: true,
          // smoother live edge tracking:
          liveSyncDurationCount: 3,
          maxLiveSyncPlaybackRate: 1.2,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          // simple recoverables
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
              hls.recoverMediaError();
          }
        });
        try {
          await video.play();
        } catch {}
        return () => hls.destroy();
      }
    })();
  }, [src]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      autoPlay
      muted
      style={{ width: "100%", maxWidth: 960 }}
    />
  );
}
```

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@livekit/components-react": "^2.9.14",
    "@livekit/components-styles": "^1.1.6",
    "hls.js": "^1.6.10",
    "livekit-client": "^2.15.5",
    "next": "15.4.7",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.4.7",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```


<!-- Backend code -->


```javascript
import "dotenv/config";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
  SegmentedFileOutput,
  S3Upload,
  TrackSource,
  TrackType,
} from "livekit-server-sdk";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

const server = createServer(app);
const io = new IOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || true },
});

const HOST = process.env.LIVEKIT_HOST; // https://<proj>.livekit.cloud
const WS_URL = process.env.LIVEKIT_WS_URL; // wss://<proj>.livekit.cloud
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

// HLS CDN (CloudFront or similar) and S3 path prefix for segments
const HLS_PUBLIC_BASE = process.env.HLS_PUBLIC_BASE; // e.g. https://cdn.example.com
const HLS_PREFIX = process.env.HLS_PREFIX || "hls"; // folder prefix in your bucket

if (!HOST || !WS_URL || !API_KEY || !API_SECRET) {
  console.error(
    "Missing envs. Set LIVEKIT_HOST, LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET"
  );
  process.exit(1);
}

const rooms = new RoomServiceClient(HOST, API_KEY, API_SECRET);
const egress = new EgressClient(HOST, API_KEY, API_SECRET);

// Track active HLS egress per room so we can stop on End
const activeEgressByRoom = new Map(); // roomName -> Set<egressId>

// ---------- roles & grants ----------
const ROLES = ["admin", "moderator", "participant", "observer"];
const isAdminish = (role) => role === "admin" || role === "moderator";

// ---- MongoDB (whiteboard persistence only) ----
const MONGO = process.env.MONGODB_URI;
if (!MONGO) {
  console.warn("MONGODB_URI not set; whiteboard history won’t be persisted.");
} else {
  mongoose
    .connect(MONGO, { dbName: "meet" })
    .then(() => console.log("Mongo connected"))
    .catch((e) => console.error("Mongo connection error", e?.message || e));
}

// Minimal stroke schema: one document per stroke segment
const WhiteboardStrokeSchema = new mongoose.Schema(
  {
    roomName: { type: String, index: true },
    sessionId: { type: String, index: true }, // changes each open/close
    seq: Number, // increasing sequence number per session
    author: { identity: String, name: String, role: String },
    tool: { type: String, default: "pen" }, // 'pen' | 'eraser' (eraser is just draw with bg)
    shape: {
      type: String,
      enum: ["free", "line", "rect", "circle", "text"],
      default: "free",
    },
    color: { type: String, default: "#111" },
    size: { type: Number, default: 2 },
    points: [{ x: Number, y: Number }], // a polyline segment
    text: { type: String, default: "" },
    fontSize: { type: Number, default: 18 },
    revoked: { type: Boolean, default: false },
    ts: { type: Number, default: () => Date.now() },
  },
  { versionKey: false }
);
const WhiteboardStroke =
  mongoose.models.WhiteboardStroke ||
  mongoose.model("WhiteboardStroke", WhiteboardStrokeSchema);

function ensureRole(role) {
  if (!role || !ROLES.includes(role)) {
    const err = new Error(
      `Invalid or missing role. Allowed: ${ROLES.join(", ")}`
    );
    err.status = 400;
    throw err;
  }
}

function ensureAdminish(role) {
  if (!isAdminish(role)) {
    const err = new Error("Forbidden: only admin/moderator allowed");
    err.status = 403;
    throw err;
  }
}

function grantFor(role, room) {
  const base = {
    roomJoin: true,
    room,
    canSubscribe: true,
    canPublishData: true,
  };

  if (role === "observer") {
    return {
      ...base,
      canPublish: false,
      canPublishData: false,
      canPublishSources: [],
    };
  }

  if (role === "participant") {
    return {
      ...base,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE, TrackSource.CAMERA],
    };
  }

  // admin/moderator
  return {
    ...base,
    canPublish: true,
    roomAdmin: true,
    canPublishSources: [
      TrackSource.MICROPHONE,
      TrackSource.CAMERA,
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO,
    ],
  };
}

async function mintToken({ room, identity, role }) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity,
    metadata: JSON.stringify({ role }),
  });
  at.addGrant(grantFor(role, room));
  return await at.toJwt();
}

// ---------- HLS helpers ----------
function hlsPaths(roomName) {
  const dir = `${HLS_PREFIX}/${encodeURIComponent(roomName)}`;

  return {
    filenamePrefix: `${dir}/segment`,
    playlistName: "index.m3u8",
    livePlaylistName: "live.m3u8",
    liveUrl: HLS_PUBLIC_BASE ? `${HLS_PUBLIC_BASE}/${dir}/live.m3u8` : null,
    vodUrl: HLS_PUBLIC_BASE ? `${HLS_PUBLIC_BASE}/${dir}/index.m3u8` : null,
  };
}

async function startHlsEgress(roomName) {
  const { filenamePrefix, playlistName, livePlaylistName } = hlsPaths(roomName);

  const segments = new SegmentedFileOutput({
    // defaults to HLS; we set names + short segments (2s) for low latency
    filenamePrefix,
    playlistName,
    livePlaylistName,
    segmentDuration: 2,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: process.env.S3_ACCESS_KEY,
        secret: process.env.S3_SECRET,
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" || undefined,
      }),
    },
  });

  // Start Room Composite with HLS (segments). This supports “live playlist” + VOD on S3. :contentReference[oaicite:1]{index=1}
  const info = await egress.startRoomCompositeEgress(
    roomName,
    { segments }, // EncodedOutputs.segments
    { layout: "grid" } // pick 'speaker' / 'single-speaker' / 'grid-light' if you prefer
  );

  if (!activeEgressByRoom.has(roomName))
    activeEgressByRoom.set(roomName, new Set());
  activeEgressByRoom.get(roomName).add(info.egressId);

  return info;
}

async function stopAllEgress(roomName) {
  const ids = activeEgressByRoom.get(roomName);
  if (ids && ids.size) {
    for (const id of ids) {
      try {
        await egress.stopEgress(id);
      } catch (e) {
        console.warn("stopEgress error", id, e?.message || e);
      }
    }
    activeEgressByRoom.delete(roomName);
  }
}

// ---------- routes ----------
app.get("/health", (_, res) => res.json({ ok: true }));

// START (admin/moderator only): create room, auto-start HLS, return token + HLS URLs
app.post("/api/meeting/start", async (req, res) => {
  try {
    const { roomName, username, role } = req.body || {};
    if (!roomName || !username)
      return res.status(400).json({ error: "roomName and username required" });
    ensureRole(role);
    ensureAdminish(role);

    // ensure room exists
    try {
      await rooms.createRoom({ name: roomName, emptyTimeout: 60 * 60 });
    } catch (_) {}

    // auto-start HLS egress (record + live)
    let egressInfo = null;
    try {
      egressInfo = await startHlsEgress(roomName);
    } catch (e) {
      console.error(
        "HLS start error:",
        e?.message || e
      ); /* don’t block meeting */
    }

    const token = await mintToken({ room: roomName, identity: username, role });
    const { liveUrl, vodUrl } = hlsPaths(roomName);

    res.json({
      roomName,
      role,
      token,
      wsUrl: WS_URL,
      hls: { liveUrl, vodUrl },
      egressId: egressInfo?.egressId || null,
    });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to start meeting" });
  }
});

// JOIN (any role): participants get a token; observers just get HLS URLs (no need to connect)
app.post("/api/meeting/join", async (req, res) => {
  try {
    const { roomName, username, role = "participant" } = req.body || {};
    if (!roomName || !username)
      return res.status(400).json({ error: "roomName and username required" });
    ensureRole(role);

    const existing = await rooms.listRooms();
    const found = existing.find((r) => r.name === roomName);
    if (!found)
      return res.status(404).json({
        error: "Room not started yet. Ask the host to Start meeting.",
      });

    const { liveUrl, vodUrl } = hlsPaths(roomName);

    if (role === "observer") {
      // Observers don’t need a token or to connect; they’ll play HLS.
      return res.json({ roomName, role, hls: { liveUrl, vodUrl } });
    }

    const token = await mintToken({ room: roomName, identity: username, role });
    res.json({
      roomName,
      role,
      token,
      wsUrl: WS_URL,
      hls: { liveUrl, vodUrl },
    });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to join meeting" });
  }
});

// END (admin/moderator only): stop HLS then delete room
// const prevEndRoute = app._router.stack.find(l => l.route?.path === '/api/meeting/end'); // not required; here’s the body instead:
app.post("/api/meeting/end", async (req, res) => {
  try {
    const { roomName, role } = req.body || {};
    if (!roomName) return res.status(400).json({ error: "roomName required" });
    ensureRole(role);
    ensureAdminish(role);

    await stopAllEgress(roomName);
    await rooms.deleteRoom(roomName);

    const bos = await listBreakouts(roomName);
    for (const r of bos) {
      try {
        await closeBreakoutAndReturn(roomName, r);
      } catch {}
    }
    res.json({ ok: true });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to end meeting" });
  }
});

// ==================== MODERATION ROUTES ====================

// Mute a participant's mic/camera/screenshare by identity.
// kind: 'audio' | 'video' | 'screenshare'
app.post("/api/mod/mute", async (req, res) => {
  try {
    const { roomName, role, identity, kind, mute = true } = req.body || {};
    if (!roomName || !identity || !kind)
      return res
        .status(400)
        .json({ error: "roomName, identity, kind required" });
    ensureRole(role);
    ensureAdminish(role);

    // fetch participant to find their track SIDs
    const p = await rooms.getParticipant(roomName, identity); // includes published tracks
    // p.tracks entries include { sid, type: TrackType, source: TrackSource, muted, ... }  :contentReference[oaicite:3]{index=3}

    // pick tracks by requested target
    let selected = [];
    if (kind === "audio") {
      selected = (p.tracks || []).filter((t) => t.type === TrackType.AUDIO);
    } else if (kind === "video") {
      // camera video only (exclude screenshare)
      selected = (p.tracks || []).filter(
        (t) => t.type === TrackType.VIDEO && t.source === TrackSource.CAMERA
      );
    } else if (kind === "screenshare") {
      selected = (p.tracks || []).filter(
        (t) =>
          t.source === TrackSource.SCREEN_SHARE ||
          t.source === TrackSource.SCREEN_SHARE_AUDIO
      );
    } else {
      return res.status(400).json({ error: "invalid kind" });
    }

    // call server API to mute/unmute each publication
    for (const t of selected) {
      await rooms.mutePublishedTrack(roomName, identity, t.sid, !!mute); // server-side moderation mute :contentReference[oaicite:4]{index=4}
    }

    res.json({
      ok: true,
      tracksAffected: selected.map((t) => ({
        sid: t.sid,
        type: t.type,
        source: t.source,
      })),
    });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to mute" });
  }
});

// Allow / deny screen share for a participant (live).
// When deny=false->allow=true: we add SCREEN_SHARE* to canPublishSources.
// When allow=false: remove SCREEN_SHARE*, and also mute active screenshare tracks.

const pendingShareRequests = new Map();
const shareDecisionsByRoom = new Map();

app.post("/api/mod/screenshare", async (req, res) => {
  try {
    const { roomName, role, identity, allow } = req.body || {};
    if (!roomName || !identity || allow === undefined)
      return res
        .status(400)
        .json({ error: "roomName, identity, allow required" });
    ensureRole(role);
    ensureAdminish(role);

    const info = await rooms.getParticipant(roomName, identity);
    const current = info.permission || {}; // ParticipantPermission (may be undefined)  :contentReference[oaicite:5]{index=5}

    // Build next permission atomically. Preserve existing booleans; only change canPublishSources.
    // Start from whatever we have; default to publish mic/cam if not specified.
    const baseSources = Array.isArray(current.canPublishSources)
      ? [...current.canPublishSources]
      : [TrackSource.MICROPHONE, TrackSource.CAMERA];

    let nextSources = baseSources.filter(Boolean);

    const ensure = (s) => {
      if (!nextSources.includes(s)) nextSources.push(s);
    };
    const remove = (s) => {
      nextSources = nextSources.filter((x) => x !== s);
    };

    if (allow) {
      ensure(TrackSource.SCREEN_SHARE);
      ensure(TrackSource.SCREEN_SHARE_AUDIO);
    } else {
      remove(TrackSource.SCREEN_SHARE);
      remove(TrackSource.SCREEN_SHARE_AUDIO);
    }

    await rooms.updateParticipant(roomName, identity, {
      permission: {
        canPublish: current.canPublish ?? true,
        canPublishData: current.canPublishData ?? true,
        canSubscribe: current.canSubscribe ?? true,
        canPublishSources: nextSources, // <-- atomic set  :contentReference[oaicite:6]{index=6}
        hidden: current.hidden ?? false,
        // recorder: current.recorder ?? false,
        canUpdateMetadata: current.canUpdateMetadata ?? false,
      },
    });

    // If we just denied, also stop any ongoing share immediately.
    if (!allow) {
      const shareTracks = (info.tracks || []).filter(
        (t) =>
          t.source === TrackSource.SCREEN_SHARE ||
          t.source === TrackSource.SCREEN_SHARE_AUDIO
      );
      for (const t of shareTracks) {
        await rooms.mutePublishedTrack(roomName, identity, t.sid, true); // ensure the current share stops now :contentReference[oaicite:7]{index=7}
      }
    }

    res.json({ ok: true, allow, canPublishSources: nextSources });
  } catch (e) {
    res.status(e?.status || 500).json({
      error: e?.message || "Failed to update screen-share permission",
    });
  }
});

app.post("/api/mod/screenshare/request", async (req, res) => {
  const { roomName, identity, name } = req.body || {};

  if (!roomName || !identity)
    return res.status(400).json({ error: "roomName and identity required" });

  if (!pendingShareRequests.has(roomName))
    pendingShareRequests.set(roomName, new Map());

  pendingShareRequests
    .get(roomName)
    .set(identity, { name: name || identity, at: Date.now() });

  // clear last decision for a new request
  shareDecisionsByRoom.get(roomName)?.delete(identity);

  res.json({ ok: true });
});

// Moderator/Admin pulls pending list
app.get("/api/mod/screenshare/pending", async (req, res) => {
  const { roomName, role } = req.query;
  ensureRole(role);
  ensureAdminish(role);
  const map = pendingShareRequests.get(roomName) || new Map();
  const items = Array.from(map.entries()).map(([identity, v]) => ({
    identity,
    ...v,
  }));
  res.json({ ok: true, items });
});

// Moderator/Admin decides
app.post("/api/mod/screenshare/decide", async (req, res) => {
  try {
    const { roomName, role, identity, allow } = req.body || {};
    if (!roomName || !identity || allow === undefined) {
      return res
        .status(400)
        .json({ error: "roomName, identity, allow required" });
    }
    ensureRole(role);
    ensureAdminish(role);

    const info = await rooms.getParticipant(roomName, identity);
    const current = info.permission || {};

    // Start with current sources or default MIC+CAMERA if missing
    let nextSources = Array.isArray(current.canPublishSources)
      ? [...current.canPublishSources]
      : [TrackSource.MICROPHONE, TrackSource.CAMERA];

    const add = (s) => {
      if (!nextSources.includes(s)) nextSources.push(s);
    };
    const rm = (s) => {
      nextSources = nextSources.filter((x) => x !== s);
    };

    if (allow) {
      add(TrackSource.SCREEN_SHARE);
      add(TrackSource.SCREEN_SHARE_AUDIO);
    } else {
      rm(TrackSource.SCREEN_SHARE);
      rm(TrackSource.SCREEN_SHARE_AUDIO);
    }

    await rooms.updateParticipant(roomName, identity, {
      permission: {
        canPublish: current.canPublish ?? true,
        canPublishData: current.canPublishData ?? true,
        canSubscribe: current.canSubscribe ?? true,
        canPublishSources: nextSources,
        hidden: current.hidden ?? false,
        recorder: current.recorder ?? false,
        canUpdateMetadata: current.canUpdateMetadata ?? false,
      },
    });

    // If denied, also force-stop any active screenshare tracks
    if (!allow) {
      const shareTracks = (info.tracks || []).filter(
        (t) =>
          t.source === TrackSource.SCREEN_SHARE ||
          t.source === TrackSource.SCREEN_SHARE_AUDIO
      );
      for (const t of shareTracks) {
        await rooms.mutePublishedTrack(roomName, identity, t.sid, true);
      }
    }

    // remove from pending list
    pendingShareRequests.get(roomName)?.delete(identity);

    if (!shareDecisionsByRoom.has(roomName))
      shareDecisionsByRoom.set(roomName, new Map());
    shareDecisionsByRoom
      .get(roomName)
      .set(identity, allow ? "allowed" : "denied");

    res.json({ ok: true, allow, canPublishSources: nextSources });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to decide screen-share" });
  }
});

// (Optional) Participant polls to know if now allowed
app.get("/api/participant/canshare", async (req, res) => {
  try {
    const { roomName, identity } = req.query;
    if (!roomName || !identity)
      return res.status(400).json({ error: "roomName and identity required" });
    const p = await rooms.getParticipant(roomName, identity);
    const canShare =
      Array.isArray(p.permission?.canPublishSources) &&
      (p.permission.canPublishSources.includes(TrackSource.SCREEN_SHARE) ||
        p.permission.canPublishSources.includes(
          TrackSource.SCREEN_SHARE_AUDIO
        ));
    res.json({ ok: true, canShare });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to query permission" });
  }
});

app.get("/api/participant/share-status", async (req, res) => {
  try {
    const { roomName, identity } = req.query;
    if (!roomName || !identity)
      return res.status(400).json({ error: "roomName and identity required" });

    const pendingMap = pendingShareRequests.get(roomName);
    const pending = !!pendingMap?.has(identity);

    // check current permission
    let canShare = false;
    try {
      const p = await rooms.getParticipant(roomName, identity);
      const sources = p.permission?.canPublishSources || [];
      canShare =
        sources.includes(TrackSource.SCREEN_SHARE) ||
        sources.includes(TrackSource.SCREEN_SHARE_AUDIO);
    } catch {
      // participant may not be in room yet — treat as not allowed
      canShare = false;
    }

    const decision = shareDecisionsByRoom.get(roomName)?.get(identity) || null;

    res.json({ ok: true, pending, canShare, decision }); // decision: 'allowed' | 'denied' | null
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to get status" });
  }
});

const breakoutsByParent = new Map();
const breakoutTimers = new Map();

const breakoutName = (parentRoom, label) => {
  const slug = String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  if (!slug) throw new Error("invalid breakout label");
  return `${parentRoom}__bo__${slug}`;
};

// helper: register a breakout room for a parent
function registerBreakout(parentRoom, bo) {
  if (!breakoutsByParent.has(parentRoom))
    breakoutsByParent.set(parentRoom, new Set());
  breakoutsByParent.get(parentRoom).add(bo);
}

// helper: list current breakouts for a parent (combine memory + live rooms prefix)
async function listBreakouts(parentRoom) {
  const prefix = `${parentRoom}__bo__`;
  const fromMem = Array.from(breakoutsByParent.get(parentRoom) || []);
  // recover from server state too (in case of server restarts)
  let fromServer = [];
  try {
    const roomsList = await rooms.listRooms();
    fromServer = roomsList
      .map((r) => r.name)
      .filter((n) => n.startsWith(prefix));
  } catch {}
  return Array.from(new Set([...fromMem, ...fromServer]));
}

function setBreakoutTimer(parentRoom, breakout, minutes) {
  clearBreakoutTimer(parentRoom, breakout);
  if (!minutes || minutes <= 0) return; // no timer
  const ms = minutes * 60 * 1000;
  const endAt = Date.now() + ms;

  const to = setTimeout(() => {
    // on expiry: close & move everyone back
    closeBreakoutAndReturn(parentRoom, breakout).catch((e) =>
      console.warn("auto-close breakout failed", breakout, e?.message || e)
    );
  }, ms);

  if (!breakoutTimers.has(parentRoom))
    breakoutTimers.set(parentRoom, new Map());
  breakoutTimers.get(parentRoom).set(breakout, { timeout: to, endAt });
}

function clearBreakoutTimer(parentRoom, breakout) {
  const m = breakoutTimers.get(parentRoom);
  const rec = m?.get(breakout);
  if (rec?.timeout) clearTimeout(rec.timeout);
  m?.delete(breakout);
  if (m && m.size === 0) breakoutTimers.delete(parentRoom);
}

function getBreakoutEndAt(parentRoom, breakout) {
  return breakoutTimers.get(parentRoom)?.get(breakout)?.endAt || null;
}

async function closeBreakoutAndReturn(parentRoom, breakout) {
  try {
    // 1) move everyone back (best-effort)
    const ps = await rooms.listParticipants(breakout);
    for (const p of ps || []) {
      try {
        await rooms.moveParticipant(breakout, p.identity, parentRoom);
      } catch {}
    }
  } catch {}
  // 2) stop egress & delete room
  try {
    await stopAllEgress(breakout);
  } catch {}
  try {
    await rooms.deleteRoom(breakout);
  } catch {}
  breakoutsByParent.get(parentRoom)?.delete(breakout);
  clearBreakoutTimer(parentRoom, breakout);
}
// we already have: startHlsEgress(roomName) + hlsPaths(roomName) + stopAllEgress(roomName)

// ====== NEW: Create a breakout (admin/mod only), auto-start HLS ======
// create breakout
app.post("/api/breakouts/create", async (req, res) => {
  try {
    const { parentRoom, label, role, durationMinutes } = req.body || {};
    if (!parentRoom || !label)
      return res.status(400).json({ error: "parentRoom and label required" });
    ensureRole(role);
    ensureAdminish(role);

    const boRoom = breakoutName(parentRoom, label);

    try {
      await rooms.createRoom({ name: boRoom, emptyTimeout: 60 * 60 });
    } catch {}

    // auto-start HLS
    let egressInfo = null;
    try {
      egressInfo = await startHlsEgress(boRoom);
    } catch (e) {
      console.error("HLS start error (breakout):", e?.message || e);
    }

    registerBreakout(parentRoom, boRoom);

    // schedule timer (optional)
    const mins = Number(durationMinutes) || 0;
    setBreakoutTimer(parentRoom, boRoom, mins);

    const { liveUrl, vodUrl } = hlsPaths(boRoom);
    res.json({
      ok: true,
      breakout: boRoom,
      hls: { liveUrl, vodUrl },
      egressId: egressInfo?.egressId || null,
      endAt: getBreakoutEndAt(parentRoom, boRoom),
    });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to create breakout" });
  }
});

app.post("/api/breakouts/extend", async (req, res) => {
  try {
    const { parentRoom, breakout, role, addMinutes } = req.body || {};
    if (!parentRoom || !breakout)
      return res
        .status(400)
        .json({ error: "parentRoom and breakout required" });
    ensureRole(role);
    ensureAdminish(role);

    const currentEnd = getBreakoutEndAt(parentRoom, breakout);
    const remainingMs =
      currentEnd && currentEnd > Date.now() ? currentEnd - Date.now() : 0;
    const extraMs = (Number(addMinutes) || 0) * 60 * 1000;
    const totalMinutes = Math.ceil((remainingMs + extraMs) / 60000);

    setBreakoutTimer(parentRoom, breakout, totalMinutes);
    res.json({ ok: true, endAt: getBreakoutEndAt(parentRoom, breakout) });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to extend breakout" });
  }
});

// ====== NEW: Close a breakout (admin/mod only): stop egress + delete room ======
app.post("/api/breakouts/close", async (req, res) => {
  try {
    const { parentRoom, breakout, role } = req.body || {};
    if (!parentRoom || !breakout)
      return res
        .status(400)
        .json({ error: "parentRoom and breakout required" });
    ensureRole(role);
    ensureAdminish(role);

    await closeBreakoutAndReturn(parentRoom, breakout);
    res.json({ ok: true });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to close breakout" });
  }
});

// ====== NEW: Move a participant to another room (admin/mod only) ======
// Uses RoomServiceClient.moveParticipant (Cloud/Private Cloud feature).
app.post("/api/breakouts/move", async (req, res) => {
  try {
    const { fromRoom, identity, toRoom, role } = req.body || {};
    if (!fromRoom || !identity || !toRoom)
      return res
        .status(400)
        .json({ error: "fromRoom, identity, toRoom required" });
    ensureRole(role);
    ensureAdminish(role);

    await rooms.moveParticipant(fromRoom, identity, toRoom); // seamless move server-side
    res.json({ ok: true });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to move participant" });
  }
});

// ====== NEW: Introspection endpoints ======

// List current breakout state (+ HLS URLs) for observers and UI
app.get("/api/breakouts/state", async (req, res) => {
  const { parentRoom } = req.query || {};
  if (!parentRoom)
    return res.status(400).json({ error: "parentRoom required" });

  const boList = await listBreakouts(parentRoom);
  const main = { roomName: parentRoom, ...hlsPaths(parentRoom) };
  const breakouts = boList.map((r) => ({
    roomName: r,
    ...hlsPaths(r),
    endAt: getBreakoutEndAt(parentRoom, r),
  }));

  res.json({ ok: true, main, breakouts });
});

// List participants of any room (for cross-room moves)
app.get("/api/room/participants", async (req, res) => {
  try {
    const { roomName, role } = req.query || {};
    ensureRole(role);
    ensureAdminish(role);
    if (!roomName) return res.status(400).json({ error: "roomName required" });

    const ps = await rooms.listParticipants(roomName);

    const items = (ps || [])
      .filter((p) => {
        const k = p.kind ?? "standard";
        // server enum: 0 = STANDARD; string mode: 'standard'
        const isStandard = typeof k === "string" ? k === "standard" : k === 0;
        const isHidden = !!p.permission?.hidden;
        return isStandard && !isHidden;
      })
      .map((p) => ({ identity: p.identity, name: p.name || p.identity }));

    res.json({ ok: true, items });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Failed to list participants" });
  }
});

// ---- Whiteboard state (in-memory) ----
// For each LiveKit room we track current whiteboard session + permissions
const wbStateByRoom = new Map();
/*
  wbState = {
    open: boolean,
    sessionId: string,
    seq: number,                 // last committed sequence
    rolesAllowed: new Set(['admin','moderator','participant']) // default
  }
*/

function getOrInitWB(roomName) {
  let s = wbStateByRoom.get(roomName);
  if (!s) {
    s = {
      open: false,
      sessionId: "",
      seq: 0,
      rolesAllowed: new Set(["admin", "moderator", "participant"]), // observers cannot draw
    };
    wbStateByRoom.set(roomName, s);
  }
  return s;
}

// Verify the LiveKit JWT you already mint and extract identity/role safely.
// We expect client to pass that token when connecting Socket.IO.
function decodeLKToken(token) {
  // LiveKit token is a JWT signed using your API_SECRET
  const decoded = jwt.verify(token, API_SECRET, { algorithms: ["HS256"] });
  // LiveKit puts custom metadata as string; parse if present
  let role = "participant";
  try {
    if (decoded?.metadata) {
      const md = JSON.parse(decoded.metadata);
      if (md?.role) role = md.role;
    }
  } catch {}
  const identity = decoded?.sub || decoded?.name || "unknown";
  return { identity, role };
}

function canDraw(role, wb) {
  if (!wb?.open) return false;
  if (!role) return false;
  // observers never
  if (role === "observer") return false;
  // default rolesAllowed contains admin/mod/participant
  return wb.rolesAllowed.has(role);
}

// ---- Whiteboard REST ----

// Open whiteboard (admin/mod only). Starts a fresh sessionId.
app.post("/api/wb/open", async (req, res) => {
  try {
    const { roomName, role } = req.body || {};
    if (!roomName) return res.status(400).json({ error: "roomName required" });
    ensureRole(role);
    ensureAdminish(role);

    const wb = getOrInitWB(roomName);

    // If in-memory session is empty, try to recover from DB; else create new.
    if (!wb.sessionId) {
      if (mongoose.connection.readyState === 1) {
        const last = await WhiteboardStroke.findOne({ roomName })
          .sort({ ts: -1, seq: -1 })
          .lean();
        if (last?.sessionId) {
          wb.sessionId = last.sessionId;
          wb.seq = last.seq || 0;
        }
      }
      if (!wb.sessionId) {
        wb.sessionId = `${roomName}_${Date.now()}`;
        wb.seq = 0;
      }
    }

    wb.open = true;
    // IMPORTANT: do NOT reset wb.seq here if session already exists.
    io.to(`wb:${roomName}`).emit("wb:state", {
      open: true,
      sessionId: wb.sessionId,
    });

    res.json({ ok: true, sessionId: wb.sessionId });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to open whiteboard" });
  }
});

// Close whiteboard (admin/mod only)
app.post("/api/wb/close", async (req, res) => {
  try {
    const { roomName, role } = req.body || {};
    if (!roomName) return res.status(400).json({ error: "roomName required" });
    ensureRole(role);
    ensureAdminish(role);

    const wb = getOrInitWB(roomName);
    wb.open = false;

    io.to(`wb:${roomName}`).emit("wb:state", {
      open: false,
      sessionId: wb.sessionId,
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to close whiteboard" });
  }
});

// (Optional) Restrict or relax who can draw by role — admin/mod only
app.post("/api/wb/roles", async (req, res) => {
  try {
    const { roomName, role, rolesAllowed } = req.body || {};
    if (!roomName) return res.status(400).json({ error: "roomName required" });
    ensureRole(role);
    ensureAdminish(role);
    const valid = new Set(["admin", "moderator", "participant"]); // observers excluded
    const incoming = new Set((rolesAllowed || []).filter((r) => valid.has(r)));
    const wb = getOrInitWB(roomName);
    wb.rolesAllowed = incoming.size
      ? incoming
      : new Set(["admin", "moderator", "participant"]);
    io.to(`wb:${roomName}`).emit("wb:roles", Array.from(wb.rolesAllowed));
    res.json({ ok: true, rolesAllowed: Array.from(wb.rolesAllowed) });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to update roles" });
  }
});

// Fetch whiteboard history (for replay/export)
// If sessionId omitted, returns latest (current) session strokes.
app.get("/api/wb/history", async (req, res) => {
  try {
    const { roomName, sessionId } = req.query || {};
    if (!roomName) return res.status(400).json({ error: "roomName required" });
    const wb = getOrInitWB(roomName);

    let sid = sessionId || wb.sessionId;
    if (!sid && mongoose.connection.readyState === 1) {
      // Find the most recent stroke for this room to recover its session
      const last = await WhiteboardStroke.findOne({ roomName })
        .sort({ ts: -1, seq: -1 })
        .lean();
      if (last?.sessionId) sid = last.sessionId;
    }
    if (!sid) return res.json({ ok: true, strokes: [] });

    const strokes = await WhiteboardStroke.find({
      roomName,
      sessionId: sid,
      $or: [{ revoked: { $exists: false } }, { revoked: false }],
    })
      .sort({ seq: 1 })
      .lean();

    res.json({ ok: true, sessionId: sid, strokes });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to fetch history" });
  }
});

// ---- Socket.IO: Whiteboard realtime ----
io.on("connection", (socket) => {
  // Expect query: ?roomName=...&token=LK_JWT
  const { roomName, token } = socket.handshake.query || {};

  if (!roomName || !token) {
    socket.emit("wb:error", "roomName and token required");
    return socket.disconnect(true);
  }

  // Verify LiveKit JWT to trust identity+role
  let identity = "unknown";
  let role = "participant";
  try {
    const dec = decodeLKToken(String(token));
    identity = dec.identity;
    role = dec.role;
    ensureRole(role);
  } catch (e) {
    socket.emit("wb:error", "invalid token");
    return socket.disconnect(true);
  }

  const roomKey = `wb:${roomName}`;
  socket.join(roomKey);

  // Send current state to this client
  const wb = getOrInitWB(String(roomName));
  socket.emit("wb:state", { open: wb.open, sessionId: wb.sessionId });
  socket.emit("wb:roles", Array.from(wb.rolesAllowed));

  // Join/leave logs (optional)
  // console.log(`[wb] ${identity} (${role}) connected to ${roomName}`);

  // Client requests: start drawing stream (the client decides when to send strokes)
  socket.on("wb:stroke", async (payload) => {

    // payload = { tool, color, size, points: [{x,y},...], name? }
    // plus optional: { shape:'free|line|rect|circle|text', text, fontSize }
    try {
      const wb = getOrInitWB(String(roomName));
      if (!canDraw(role, wb)) return; // ignore silently if not permitted
      if (!Array.isArray(payload?.points) || payload.points.length === 0)
        return;

      wb.seq += 1;
      const strokeDoc = {
        roomName: String(roomName),
        sessionId: wb.sessionId,
        seq: wb.seq,
        author: { identity, name: payload?.name || identity, role },
        tool: payload?.tool || "pen",
        shape: ["free", "line", "rect", "circle", "text"].includes(
          payload?.shape
        )
          ? payload.shape
          : "free",
        color: payload?.color || "#111",
        size: Number(payload?.size || 2),
        points: payload.points.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
        text:
          typeof payload?.text === "string" ? payload.text.slice(0, 2000) : "",
        fontSize: Number(payload?.fontSize || 18),
        ts: Date.now(),
      };

      // Persist if DB available
      if (mongoose.connection.readyState === 1) {
        try {
          await WhiteboardStroke.create(strokeDoc);
        } catch {}
      }

      // Broadcast to others in the room (including sender for idempotent UI)
      io.to(roomKey).emit("wb:stroke", strokeDoc);
    } catch (e) {
      // swallow
    }
  });

  // Clear board (admin/mod only). Frontend should confirm before sending.
  socket.on("wb:clear", async () => {
    try {
      ensureAdminish(role);
      const wb = getOrInitWB(String(roomName));
      if (!wb.open) return;
      // Logical clear = bump session to keep history of previous content,
      // or do a "soft clear event" and keep same session.
      // Here we soft-clear but keep session id; client erases canvas.
      io.to(roomKey).emit("wb:clear");
    } catch (e) {}
  });

  // Undo last non-revoked stroke by this author (in current session)
  socket.on("wb:undo", async () => {
    try {
      const wb = getOrInitWB(String(roomName));
      if (!canDraw(role, wb)) return;
      if (mongoose.connection.readyState !== 1) return; // no-op if no DB
      const last = await WhiteboardStroke.findOne({
        roomName: String(roomName),
        sessionId: wb.sessionId,
        "author.identity": identity,
        $or: [{ revoked: { $exists: false } }, { revoked: false }],
      }).sort({ seq: -1, ts: -1 });
      if (!last) return;
      last.revoked = true;
      await last.save();
      io.to(roomKey).emit("wb:refresh"); // clients will re-hydrate
    } catch {}
  });

  // Redo (re-apply) the most recently revoked stroke by this author
  socket.on("wb:redo", async () => {
    try {
      const wb = getOrInitWB(String(roomName));
      if (!canDraw(role, wb)) return;
      if (mongoose.connection.readyState !== 1) return;
      const lastRevoked = await WhiteboardStroke.findOne({
        roomName: String(roomName),
        sessionId: wb.sessionId,
        "author.identity": identity,
        revoked: true,
      }).sort({ seq: -1, ts: -1 });
      if (!lastRevoked) return;
      lastRevoked.revoked = false;
      await lastRevoked.save();
      io.to(roomKey).emit("wb:refresh");
    } catch {}
  });

  // Simple ping for presence/latency
  socket.on("wb:ping", () => socket.emit("wb:pong", Date.now()));

  socket.on("disconnect", () => {
    // console.log(`[wb] ${identity} left ${roomName}`);
  });
});

server.listen(process.env.PORT || 3001, () =>
  console.log(`LiveKit backend + sockets on :${process.env.PORT || 3001}`)
);
```


```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.1",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "livekit-server-sdk": "^2.13.2",
    "mongoose": "^8.17.2",
    "nodemon": "^3.1.10",
    "socket.io": "^4.8.1"
  }
}

```