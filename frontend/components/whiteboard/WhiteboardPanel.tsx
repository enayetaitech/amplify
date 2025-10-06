"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Tool, Stroke, WhiteboardCanvasHandle } from "./WhiteboardCanvas";
import type { Socket } from "socket.io-client";
import WhiteboardCanvas from "./WhiteboardCanvas";
import WhiteboardToolbar from "./WhiteboardToolbar";
import { useRoomContext } from "@livekit/components-react";
import { LocalVideoTrack, Track } from "livekit-client";

export default function WhiteboardPanel({
  sessionId,
  socket,
  role,
}: {
  sessionId: string;
  socket?: Socket | null;
  role: "Participant" | "Observer" | "Moderator" | "Admin";
}) {
  const canvasRef = useRef<WhiteboardCanvasHandle | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [locked, setLocked] = useState(false);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#111827");
  const [size, setSize] = useState(3);
  const [dims, setDims] = useState<{ w: number; h: number }>({
    w: 1200,
    h: 700,
  });
  const room = useRoomContext();
  const whiteboardTrackRef = useRef<LocalVideoTrack | null>(null);
  const whiteboardMediaTrackRef = useRef<MediaStreamTrack | null>(null);
  const keepAliveRef = useRef<number | null>(null);

  // compute current user info on demand to avoid effect dependency issues

  useEffect(() => {
    if (!socket) return;
    // join whiteboard session
    socket.emit(
      "whiteboard:join",
      { sessionId },
      (resp: { nextSeq?: number; recentStrokes?: Stroke[] } | undefined) => {
        if (!resp) return;
        const { recentStrokes } = resp || {};
        if (Array.isArray(recentStrokes)) {
          recentStrokes.forEach((s) => {
            try {
              canvasRef.current?.addRemoteStroke?.(s);
            } catch {}
          });
        }
      }
    );

    // handle broadcasts
    socket.on("whiteboard:stroke:new", (stroke: unknown) => {
      try {
        const s = stroke as Stroke;
        // ignore strokes authored by me (we already add them locally)
        const author = (
          s as unknown as { author?: { email?: string; name?: string } }
        )?.author;
        if (author) {
          try {
            const raw = localStorage.getItem("liveSessionUser");
            const meLocal = raw ? JSON.parse(raw) : { name: "", email: "" };
            if (author.email && author.email === String(meLocal.email || ""))
              return;
            if (author.name && author.name === String(meLocal.name || ""))
              return;
          } catch {}
        }
        canvasRef.current?.addRemoteStroke?.(s);
      } catch {}
    });
    socket.on("whiteboard:stroke:revoked", ({ seqs }: { seqs: number[] }) => {
      try {
        canvasRef.current?.revokeSeqs?.(seqs);
      } catch {}
    });
    socket.on("whiteboard:cleared", () => {
      canvasRef.current?.clear();
    });
    socket.on("whiteboard:lock:changed", (p: unknown) => {
      try {
        const obj = p as { sessionId?: string; locked?: boolean } | undefined;
        if (obj && obj.sessionId === sessionId) setLocked(Boolean(obj.locked));
      } catch {}
    });

    return () => {
      socket.off("whiteboard:stroke:new");
      socket.off("whiteboard:stroke:revoked");
      socket.off("whiteboard:cleared");
      socket.off("whiteboard:lock:changed");
    };
  }, [socket, sessionId]);

  // observe size for fluid canvas (subtract toolbar height)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const padX =
        parseFloat(style.paddingLeft || "0") +
        parseFloat(style.paddingRight || "0");
      const padY =
        parseFloat(style.paddingTop || "0") +
        parseFloat(style.paddingBottom || "0");

      const toolbar = el.querySelector<HTMLDivElement>("[data-wb-toolbar]");
      const toolbarH = toolbar ? toolbar.getBoundingClientRect().height : 56;
      const tStyle = toolbar ? window.getComputedStyle(toolbar) : null;
      const toolbarMB = tStyle ? parseFloat(tStyle.marginBottom || "0") : 0;

      const borderFudge = 6; // account for borders/rounding
      const w = Math.max(300, Math.floor(rect.width - padX - borderFudge));
      const h = Math.max(
        200,
        Math.floor(rect.height - padY - toolbarH - toolbarMB - borderFudge)
      );
      setDims((d) => (d.w !== w || d.h !== h ? { w, h } : d));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    // also listen to window resize because sidebars can change overall layout
    const onWin = () => measure();
    window.addEventListener("resize", onWin);
    return () => ro.disconnect();
  }, []);

  const canLock = role === "Moderator" || role === "Admin";

  // Publish canvas as a LiveKit video track (so HLS/recording includes it)
  useEffect(() => {
    async function startPublish() {
      try {
        if (!room) return;
        if (!(role === "Moderator" || role === "Admin")) return;
        const canvasEl = canvasRef.current?.getCanvasElement?.();
        if (!canvasEl) return;

        // If already publishing, stop first (handle resize recapture)
        if (whiteboardTrackRef.current) {
          try {
            room.localParticipant.unpublishTrack(
              whiteboardTrackRef.current,
              true
            );
          } catch {}
          try {
            whiteboardTrackRef.current.stop();
          } catch {}
          whiteboardTrackRef.current = null;
        }
        if (whiteboardMediaTrackRef.current) {
          try {
            whiteboardMediaTrackRef.current.stop();
          } catch {}
          whiteboardMediaTrackRef.current = null;
        }

        const stream = canvasEl.captureStream(20); // ~20 fps is enough for drawings
        const mediaTrack = stream.getVideoTracks()[0];
        if (!mediaTrack) return;
        whiteboardMediaTrackRef.current = mediaTrack;
        const localTrack = new LocalVideoTrack(mediaTrack);
        whiteboardTrackRef.current = localTrack;
        await room.localParticipant.publishTrack(localTrack, {
          name: "whiteboard",
          source: Track.Source.ScreenShare,
        });

        // Heartbeat: toggle a 1px dot so encoders see periodic changes
        try {
          const ctx = canvasEl.getContext("2d");
          if (ctx) {
            let toggle = false;
            keepAliveRef.current = window.setInterval(() => {
              try {
                const px = Math.max(1, canvasEl.clientWidth) - 1;
                const py = Math.max(1, canvasEl.clientHeight) - 1;
                ctx.save();
                ctx.globalCompositeOperation = "source-over";
                ctx.fillStyle = toggle ? "#ffffff" : "#fefefe";
                ctx.fillRect(px, py, 1, 1);
                ctx.restore();
                toggle = !toggle;
              } catch {}
            }, 1000);
          }
        } catch {}
      } catch {}
    }

    // Start on mount and when canvas size changes (recapture)
    startPublish();

    return () => {
      if (keepAliveRef.current) {
        try {
          clearInterval(keepAliveRef.current);
        } catch {}
        keepAliveRef.current = null;
      }
      try {
        if (room && whiteboardTrackRef.current) {
          room.localParticipant.unpublishTrack(
            whiteboardTrackRef.current,
            true
          );
        }
      } catch {}
      try {
        whiteboardTrackRef.current?.stop();
      } catch {}
      whiteboardTrackRef.current = null;
      try {
        whiteboardMediaTrackRef.current?.stop();
      } catch {}
      whiteboardMediaTrackRef.current = null;
    };
  }, [room, role, dims.w, dims.h]);

  return (
    <div
      ref={containerRef}
      className="p-3 bg-gray-50 rounded flex flex-col min-h-0 h-full"
    >
      <div className="mb-2" data-wb-toolbar>
        <WhiteboardToolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
          onUndo={() => {
            const s = canvasRef.current?.getUndoTarget?.();
            if (s && s.seq && socket) {
              socket.emit(
                "whiteboard:stroke:revoke",
                { sessionId, seqs: [s.seq] },
                () => {}
              );
            } else {
              canvasRef.current?.undo();
            }
          }}
          onRedo={() => {
            const redo = canvasRef.current?.popRedoTarget?.();
            if (redo && socket) {
              // add locally first so author filter on broadcast doesn't hide it
              try {
                canvasRef.current?.addRemoteStroke?.(redo);
              } catch {}
              const payload = {
                sessionId,
                tool: redo.tool,
                shape:
                  redo.tool === "pencil" || redo.tool === "eraser"
                    ? "free"
                    : redo.tool,
                color: redo.color,
                size: redo.size,
                points: redo.points,
                from: redo.from,
                to: redo.to,
                text: redo.text,
              };
              socket.emit(
                "whiteboard:stroke:add",
                payload,
                (ack: { ok?: boolean; seq?: number } | undefined) => {
                  try {
                    if (ack?.ok && typeof ack.seq === "number") {
                      canvasRef.current?.assignSeq?.(redo.id, ack.seq);
                    }
                  } catch {}
                }
              );
            } else {
              canvasRef.current?.redo();
            }
          }}
          onClear={() => {
            if (socket && (role === "Moderator" || role === "Admin")) {
              socket.emit("whiteboard:clear", { sessionId }, () => {});
            } else {
              canvasRef.current?.clear();
            }
          }}
          onExport={() => {
            try {
              canvasRef.current?.exportPNG();
            } catch {}
          }}
          locked={locked}
          onToggleLock={(l: boolean) => {
            if (!socket) return;
            socket.emit("whiteboard:lock", { sessionId, locked: l }, () => {});
            setLocked(l);
          }}
          canLock={canLock}
        />
      </div>

      <div className="flex-1 min-h-0">
        <WhiteboardCanvas
          ref={canvasRef}
          width={dims.w}
          height={dims.h}
          readOnly={role === "Observer"}
          tool={tool}
          color={color}
          size={size}
          onStrokeCreated={(s: Stroke) => {
            if (!socket) return;
            // send stroke to server
            const payload = {
              sessionId,
              tool: s.tool,
              shape:
                s.tool === "pencil" || s.tool === "eraser" ? "free" : s.tool,
              color: s.color,
              size: s.size,
              points: s.points,
              from: s.from,
              to: s.to,
              text: s.text,
            };
            socket.emit(
              "whiteboard:stroke:add",
              payload,
              (ack: { ok?: boolean; seq?: number } | undefined) => {
                try {
                  if (ack?.ok && typeof ack.seq === "number") {
                    canvasRef.current?.assignSeq?.(s.id, ack.seq);
                  }
                } catch {}
              }
            );
          }}
        />
      </div>
    </div>
  );
}
