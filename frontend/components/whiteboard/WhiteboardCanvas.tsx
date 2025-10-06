"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
// UI controls live in WhiteboardToolbar; canvas is pure drawing surface

type Point = { x: number; y: number };

export type Tool = "pencil" | "eraser" | "line" | "rect" | "circle" | "text";

export type Stroke = {
  id: string;
  tool: Tool;
  color: string;
  size: number;
  points?: Point[]; // for pencil
  from?: Point; // for shapes
  to?: Point; // for shapes
  text?: string;
  seq?: number;
  revoked?: boolean;
};

type Props = {
  width?: number;
  height?: number;
  readOnly?: boolean;
  tool?: Tool;
  color?: string;
  size?: number;
  onStrokeCreated?: (s: Stroke) => void;
};

export type WhiteboardCanvasHandle = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  exportPNG: () => void;
  addRemoteStroke?: (s: Stroke) => void;
  revokeSeqs?: (seqs: number[]) => void;
  assignSeq?: (localId: string, seq: number) => void;
  getUndoTarget?: () => Stroke | null;
  popRedoTarget?: () => Stroke | null;
  getCanvasElement?: () => HTMLCanvasElement | null;
};

const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, Props>(
  (
    {
      width = 800,
      height = 500,
      readOnly = false,
      tool: propTool,
      color: propColor,
      size: propSize,
      onStrokeCreated: propsOnStrokeCreated,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef<Stroke | null>(null);
    const [typing, setTyping] = useState<{
      active: boolean;
      from: Point | null;
      text: string;
    }>({ active: false, from: null, text: "" });
    const [caretVisible, setCaretVisible] = useState(true);

    const [tool, setTool] = useState<Tool>(propTool || "pencil");
    const [color, setColor] = useState<string>(propColor || "#111827");
    const [size, setSize] = useState<number>(propSize ?? 3);

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [redoStack, setRedoStack] = useState<Stroke[]>([]);

    // sync external props
    useEffect(() => {
      if (propTool) setTool(propTool);
    }, [propTool]);
    useEffect(() => {
      if (propColor) setColor(propColor);
    }, [propColor]);
    useEffect(() => {
      if (propSize !== undefined) setSize(propSize);
    }, [propSize]);

    // initialize canvas for DPR, recalc whenever size changes
    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const cssW = Math.max(1, width);
      const cssH = Math.max(1, height);
      const pxW = Math.floor(cssW * dpr);
      const pxH = Math.floor(cssH * dpr);
      if (c.width !== pxW) c.width = pxW;
      if (c.height !== pxH) c.height = pxH;
      c.style.width = `${cssW}px`;
      c.style.height = `${cssH}px`;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      redraw();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width, height]);

    // redraw whenever strokes change
    useEffect(() => {
      redraw();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [strokes]);

    // blink caret while typing and trigger redraws for live typing
    useEffect(() => {
      if (!typing.active) return;
      const id = setInterval(() => {
        setCaretVisible((v) => !v);
      }, 500);
      return () => clearInterval(id);
    }, [typing.active]);

    useEffect(() => {
      if (typing.active) redraw();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typing, caretVisible, color, propSize, size]);

    function redraw() {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      // clear background
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      // ensure opaque background so canvas capture isn't black/transparent in HLS
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();

      // draw each stroke
      for (const s of strokes) {
        drawStroke(ctx, s);
      }

      // draw live typing overlay
      if (typing.active && typing.from) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `${Math.max(12, (propSize ?? size) * 4)}px sans-serif`;
        const text = typing.text || "";
        ctx.fillText(text, typing.from.x, typing.from.y);
        // caret
        if (caretVisible) {
          const metrics = ctx.measureText(text);
          const caretX = typing.from.x + metrics.width + 1;
          const caretY = typing.from.y;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(caretX, caretY - Math.max(10, (propSize ?? size) * 3));
          ctx.lineTo(caretX, caretY + 3);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
      if (s.revoked) return;
      if (s.tool === "pencil") {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        ctx.beginPath();
        const pts = s.points || [];
        if (pts.length > 0) {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
        ctx.restore();
      } else if (s.tool === "eraser") {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = s.size;
        ctx.beginPath();
        const pts = s.points || [];
        if (pts.length > 0) {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
        ctx.restore();
      } else if (s.tool === "line") {
        if (!s.from || !s.to) return;
        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        ctx.beginPath();
        ctx.moveTo(s.from.x, s.from.y);
        ctx.lineTo(s.to.x, s.to.y);
        ctx.stroke();
        ctx.restore();
      } else if (s.tool === "rect") {
        if (!s.from || !s.to) return;
        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        const x = Math.min(s.from.x, s.to.x);
        const y = Math.min(s.from.y, s.to.y);
        const w = Math.abs(s.to.x - s.from.x);
        const h = Math.abs(s.to.y - s.from.y);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      } else if (s.tool === "circle") {
        if (!s.from || !s.to) return;
        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        const cx = (s.from.x + s.to.x) / 2;
        const cy = (s.from.y + s.to.y) / 2;
        const rx = Math.abs(s.to.x - s.from.x) / 2;
        const ry = Math.abs(s.to.y - s.from.y) / 2;
        const r = Math.max(rx, ry);
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (s.tool === "text") {
        if (!s.from || !s.text) return;
        ctx.save();
        ctx.fillStyle = s.color;
        ctx.font = `${Math.max(12, s.size * 4)}px sans-serif`;
        ctx.fillText(s.text, s.from.x, s.from.y);
        ctx.restore();
      }
    }

    function pointerToPoint(e: PointerEvent | React.PointerEvent) {
      const c = canvasRef.current;
      if (!c) return { x: 0, y: 0 };
      const rect = c.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handlePointerDown(e: React.PointerEvent) {
      if (readOnly) return;
      const pt = pointerToPoint(e);
      isDrawingRef.current = true;
      setRedoStack([]);

      const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
      if (tool === "text") {
        // If already typing, commit current text before starting a new one
        if (typing.active) {
          if ((typing.text || "").trim() && typing.from) {
            const s: Stroke = {
              id,
              tool: "text",
              color,
              size: Math.max(4, size),
              from: typing.from,
              text: typing.text,
            };
            setStrokes((p) => [...p, s]);
            if (propsOnStrokeCreated) propsOnStrokeCreated(s);
          }
        }
        setTyping({ active: true, from: pt, text: "" });
        // focus canvas to receive keystrokes
        try {
          canvasRef.current?.focus();
        } catch {}
        isDrawingRef.current = false;
        currentStrokeRef.current = null;
        return;
      }

      if (tool === "pencil" || tool === "eraser") {
        const s: Stroke = { id, tool, color, size, points: [pt] };
        currentStrokeRef.current = s;
        setStrokes((p) => [...p, s]);
      } else {
        // shapes
        const s: Stroke = { id, tool, color, size, from: pt, to: pt };
        currentStrokeRef.current = s;
        setStrokes((p) => [...p, s]);
      }
    }

    function handlePointerMove(e: React.PointerEvent) {
      if (!isDrawingRef.current) return;
      const pt = pointerToPoint(e);
      const cur = currentStrokeRef.current;
      if (!cur) return;
      if (tool === "text") return;
      if (cur.tool === "pencil" || cur.tool === "eraser") {
        cur.points = [...(cur.points || []), pt];
        // update last stroke
        setStrokes((prev) => {
          const copy = prev.slice();
          copy[copy.length - 1] = { ...cur };
          return copy;
        });
      } else {
        cur.to = pt;
        setStrokes((prev) => {
          const copy = prev.slice();
          copy[copy.length - 1] = { ...cur };
          return copy;
        });
      }
    }

    function handlePointerUp() {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      // notify parent of newly completed stroke (last in strokes)
      const last = strokes[strokes.length - 1];
      if (last && propsOnStrokeCreated) {
        propsOnStrokeCreated(last);
      }
      currentStrokeRef.current = null;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
      if (readOnly) return;
      if (!typing.active) return;
      const key = e.key;
      if (key === "Enter") {
        e.preventDefault();
        if ((typing.text || "").trim() && typing.from) {
          const id =
            String(Date.now()) + Math.random().toString(36).slice(2, 7);
          const s: Stroke = {
            id,
            tool: "text",
            color,
            size: Math.max(4, size),
            from: typing.from,
            text: typing.text,
          };
          setStrokes((p) => [...p, s]);
          if (propsOnStrokeCreated) propsOnStrokeCreated(s);
        }
        setTyping({ active: false, from: null, text: "" });
        return;
      }
      if (key === "Escape") {
        e.preventDefault();
        setTyping({ active: false, from: null, text: "" });
        return;
      }
      if (key === "Backspace") {
        e.preventDefault();
        setTyping((t) => ({ ...t, text: (t.text || "").slice(0, -1) }));
        return;
      }
      if (key.length === 1) {
        // regular character
        e.preventDefault();
        setTyping((t) => ({ ...t, text: (t.text || "") + key }));
      }
    }

    function handleBlur() {
      if (!typing.active) return;
      if ((typing.text || "").trim() && typing.from) {
        const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
        const s: Stroke = {
          id,
          tool: "text",
          color,
          size: Math.max(4, size),
          from: typing.from,
          text: typing.text,
        };
        setStrokes((p) => [...p, s]);
        if (propsOnStrokeCreated) propsOnStrokeCreated(s);
      }
      setTyping({ active: false, from: null, text: "" });
    }

    // expose imperative methods for parent integration
    function addRemoteStroke(s: Stroke) {
      setStrokes((prev) => {
        // avoid duplicates by seq
        if (s.seq && prev.some((p) => p.seq === s.seq)) return prev;
        return [...prev, s];
      });
    }

    function revokeSeqs(seqs: number[]) {
      setStrokes((prev) =>
        prev.map((st) =>
          seqs.includes(st.seq || -1) ? { ...st, revoked: true } : st
        )
      );
    }

    function assignSeq(localId: string, seq: number) {
      setStrokes((prev) =>
        prev.map((st) => (st.id === localId ? { ...st, seq } : st))
      );
    }

    function undo() {
      setStrokes((prev) => {
        if (prev.length === 0) return prev;
        // find last non-revoked stroke
        let idx = prev.length - 1;
        while (idx >= 0 && prev[idx]?.revoked) idx--;
        if (idx < 0) return prev;
        const last = prev[idx];
        setRedoStack((r) => [last, ...r]);
        const copy = prev.slice();
        copy.splice(idx, 1);
        return copy;
      });
    }

    function redo() {
      setRedoStack((r) => {
        if (r.length === 0) return r;
        const [first, ...rest] = r;
        setStrokes((prev) => [...prev, first]);
        return rest;
      });
    }

    function clearBoard() {
      setStrokes([]);
      setRedoStack([]);
    }

    function exportPNG() {
      const c = canvasRef.current;
      if (!c) return;
      const url = c.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `whiteboard_${Date.now()}.png`;
      a.click();
    }

    useImperativeHandle(ref, () => ({
      undo,
      redo,
      clear: clearBoard,
      exportPNG,
      addRemoteStroke,
      revokeSeqs,
      assignSeq,
      getUndoTarget: () => {
        for (let i = strokes.length - 1; i >= 0; i--) {
          const st = strokes[i];
          if (!st.revoked) return st;
        }
        return null;
      },
      popRedoTarget: () => {
        if (redoStack.length === 0) return null;
        const [first, ...rest] = redoStack;
        setRedoStack(rest);
        return first;
      },
      getCanvasElement: () => canvasRef.current,
    }));

    return (
      <div className="border rounded bg-white overflow-hidden w-full h-full">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          style={{ width: "100%", height: "100%" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>
    );
  }
);
WhiteboardCanvas.displayName = "WhiteboardCanvas";

export default WhiteboardCanvas;
