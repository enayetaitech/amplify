import { Types } from "mongoose";
import WhiteboardStroke from "../../model/WhiteboardStroke";
import WhiteboardSnapshot from "../../model/WhiteboardSnapshot";
import { SessionDeliverableModel } from "../../model/SessionDeliverableModel";
import {
  buildS3Key,
  formatDeliverableFilename,
  uploadBufferToS3WithKey,
} from "../../utils/deliverables";

type Stroke = {
  tool?: string;
  shape?: "free" | "line" | "rect" | "circle" | "text";
  color?: string;
  size?: number;
  points?: { x: number; y: number }[];
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  text?: string;
};

function loadCreateCanvas(): ((w: number, h: number) => any) | null {
  try {
    // Prefer @napi-rs/canvas (prebuilt binaries for Windows/macOS/Linux)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@napi-rs/canvas");
    if (mod && typeof mod.createCanvas === "function") return mod.createCanvas;
  } catch {}
  try {
    // Fallback to node-canvas (requires native build toolchain)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("canvas");
    if (mod && typeof mod.createCanvas === "function") return mod.createCanvas;
  } catch {}
  return null;
}

function renderStrokesToPng(
  strokes: Stroke[],
  width = 1920,
  height = 1080
): Buffer | null {
  const createCanvas = loadCreateCanvas();
  if (!createCanvas) return null; // renderer unavailable on this host

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  for (const s of strokes) {
    const color = s.color || "#111827"; // default gray-900
    const size = Math.max(1, Math.min(20, Number(s.size || 2)));
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size;

    switch (s.shape) {
      case "line": {
        const a = s.from || s.points?.[0];
        const b = s.to || s.points?.[1];
        if (!a || !b) break;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        break;
      }
      case "rect": {
        const a = s.from || s.points?.[0];
        const b = s.to || s.points?.[1];
        if (!a || !b) break;
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
        break;
      }
      case "circle": {
        const a = s.from || s.points?.[0];
        const b = s.to || s.points?.[1];
        if (!a || !b) break;
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        const rx = Math.abs(b.x - a.x) / 2;
        const ry = Math.abs(b.y - a.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "text": {
        const a = s.from || s.points?.[0];
        const text = s.text || "";
        if (!a || !text) break;
        ctx.font = `${Math.max(10, size * 6)}px sans-serif`;
        ctx.fillText(text, a.x, a.y);
        break;
      }
      case "free":
      default: {
        const pts = s.points || [];
        if (pts.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        break;
      }
    }
  }

  return canvas.toBuffer("image/png");
}

export async function renderAndStoreWhiteboardSnapshot(params: {
  wbSessionId: string; // whiteboard logical session id (string)
  projectId: Types.ObjectId | string;
  sessionId: Types.ObjectId | string;
  baseTs: number;
  sessionTitle: string;
  takenBy: Types.ObjectId | string;
}): Promise<void> {
  const strokes = await WhiteboardStroke.find({
    sessionId: params.wbSessionId,
    revoked: { $ne: true },
  })
    .sort({ seq: 1 })
    .lean();

  if (!strokes.length) return; // nothing to render

  const png = renderStrokesToPng(strokes as Stroke[]);
  if (!png) return; // cannot render on this host (missing canvas backend)
  const filename = formatDeliverableFilename({
    baseTs: params.baseTs,
    type: "WHITEBOARD",
    sessionTitle: params.sessionTitle,
    extension: ".png",
  });
  const key = buildS3Key({
    projectId: params.projectId,
    sessionId: params.sessionId,
    filename,
  });

  // Avoid duplicate deliverables
  const exists = await SessionDeliverableModel.exists({
    projectId: params.projectId,
    sessionId: params.sessionId,
    type: "WHITEBOARD",
    storageKey: key,
  });
  if (exists) return;

  const uploaded = await uploadBufferToS3WithKey(png, "image/png", key);

  await WhiteboardSnapshot.create({
    wbSessionId: params.wbSessionId,
    pngKey: uploaded.key,
    width: 1920,
    height: 1080,
    takenBy: new Types.ObjectId(String(params.takenBy)),
  });

  await SessionDeliverableModel.create({
    sessionId: params.sessionId as any,
    projectId: params.projectId as any,
    type: "WHITEBOARD",
    displayName: filename,
    size: uploaded.size,
    storageKey: uploaded.key,
    uploadedBy: new Types.ObjectId(String(params.takenBy)),
  });
}
