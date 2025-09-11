import BreakoutRoom from "../model/BreakoutRoom";
import { Types } from "mongoose";
import { closeBreakoutByIndex } from "../controllers/BreakoutController";

// In-memory timers: sessionId -> index -> timeout
const timers = new Map<string, Map<number, NodeJS.Timeout>>();

export function scheduleBreakoutCloseTimer(
  sessionId: string,
  index: number,
  closesAt: Date
) {
  cancelBreakoutCloseTimer(sessionId, index);
  const delay = Math.max(0, closesAt.getTime() - Date.now());
  const to = setTimeout(async () => {
    try {
      await closeBreakoutByIndex(sessionId, index);
    } catch (e) {
      // ignore
    } finally {
      cancelBreakoutCloseTimer(sessionId, index);
    }
  }, delay);
  if (!timers.has(sessionId)) timers.set(sessionId, new Map());
  timers.get(sessionId)!.set(index, to);
}

export function cancelBreakoutCloseTimer(sessionId: string, index: number) {
  const m = timers.get(sessionId);
  const to = m?.get(index);
  if (to) clearTimeout(to);
  m?.delete(index);
  if (m && m.size === 0) timers.delete(sessionId);
}

export async function rescheduleAllBreakoutTimers() {
  const open = await BreakoutRoom.find({
    $or: [{ closedAt: { $exists: false } }, { closedAt: null }],
    closesAt: { $gt: new Date(0) },
  })
    .select({ sessionId: 1, index: 1, closesAt: 1 })
    .lean();
  for (const bo of open) {
    if (bo.closesAt && bo.closesAt > new Date()) {
      scheduleBreakoutCloseTimer(String(bo.sessionId), bo.index, bo.closesAt);
    }
  }
}
