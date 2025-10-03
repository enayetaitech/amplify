"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Tool, Stroke, WhiteboardCanvasHandle } from "./WhiteboardCanvas";
import type { Socket } from "socket.io-client";
import WhiteboardCanvas from "./WhiteboardCanvas";
import WhiteboardToolbar from "./WhiteboardToolbar";

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
  const [locked, setLocked] = useState(false);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#111827");
  const [size, setSize] = useState(3);

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

  const canLock = role === "Moderator" || role === "Admin";

  return (
    <div className="p-3 bg-gray-50 rounded">
      <div className="mb-2">
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

      <WhiteboardCanvas
        ref={canvasRef}
        width={1200}
        height={700}
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
            shape: s.tool === "pencil" || s.tool === "eraser" ? "free" : s.tool,
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
  );
}
