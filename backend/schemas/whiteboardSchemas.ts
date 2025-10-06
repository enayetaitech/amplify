import { z } from "zod";

export const PointSchema = z.object({ x: z.number(), y: z.number() });

export const WhiteboardJoinSchema = z.object({
  sessionId: z.string().min(1),
  wbSessionId: z.string().optional(),
});

export const WhiteboardStrokeAddSchema = z.object({
  sessionId: z.string().min(1),
  tool: z.string().min(1),
  shape: z.enum(["free", "line", "rect", "circle", "text"]),
  color: z.string().min(1),
  size: z.number().min(0),
  points: z.array(PointSchema).optional(),
  from: PointSchema.optional(),
  to: PointSchema.optional(),
  text: z.string().optional(),
});

// extend stroke add to include optional clientSeq (for client-local undo mapping)
export const WhiteboardStrokeAddWithClientSeqSchema =
  WhiteboardStrokeAddSchema.extend({
    clientSeq: z.number().int().nonnegative().optional(),
  });

export type WhiteboardStrokeAddWithClientSeq = z.infer<
  typeof WhiteboardStrokeAddWithClientSeqSchema
>;

export const WhiteboardStrokeRevokeSchema = z.object({
  sessionId: z.string().min(1),
  seqs: z.array(z.number().int().nonnegative()),
});

export const WhiteboardClearSchema = z.object({ sessionId: z.string().min(1) });

export const WhiteboardCursorUpdateSchema = z.object({
  sessionId: z.string().min(1),
  x: z.number(),
  y: z.number(),
  color: z.string().optional(),
});

export const WhiteboardLockSchema = z.object({
  sessionId: z.string().min(1),
  locked: z.boolean(),
});

// Whether the whiteboard panel should be visible in the meeting UI
export const WhiteboardVisibilitySchema = z.object({
  sessionId: z.string().min(1),
  open: z.boolean(),
});

export type WhiteboardVisibility = z.infer<typeof WhiteboardVisibilitySchema>;

export type WhiteboardJoin = z.infer<typeof WhiteboardJoinSchema>;
export type WhiteboardStrokeAdd = z.infer<typeof WhiteboardStrokeAddSchema>;
export type WhiteboardStrokeRevoke = z.infer<
  typeof WhiteboardStrokeRevokeSchema
>;
export type WhiteboardClear = z.infer<typeof WhiteboardClearSchema>;
export type WhiteboardCursorUpdate = z.infer<
  typeof WhiteboardCursorUpdateSchema
>;
export type WhiteboardLock = z.infer<typeof WhiteboardLockSchema>;
