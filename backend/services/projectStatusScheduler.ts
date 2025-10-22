import ProjectModel from "../model/ProjectModel";
import { SessionModel } from "../model/SessionModel";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import User from "../model/UserModel";
import {
  projectClosingWarning10,
  projectClosingWarning2,
} from "../constants/emailTemplates";

// Helper: find projects without future sessions and last session ended N days ago
async function projectsWithNoFutureSessions() {
  // Build a set of projectId -> latest endAtEpoch and hasFuture flag
  const now = Date.now();
  const sessions = await SessionModel.aggregate([
    {
      $group: {
        _id: "$projectId",
        latestEnd: { $max: "$endAtEpoch" },
        hasFuture: { $max: { $cond: [{ $gt: ["$startAtEpoch", now] }, 1, 0] } },
      },
    },
  ]);
  const map = new Map<string, { latestEnd?: number; hasFuture: number }>();
  sessions.forEach((s: any) =>
    map.set(String(s._id), { latestEnd: s.latestEnd, hasFuture: s.hasFuture })
  );

  const projects = await ProjectModel.find({});
  return projects.filter((p) => {
    const s = map.get(String(p._id));
    return !s || s.hasFuture === 0; // no future sessions
  });
}

export async function sendClosingWarnings() {
  const candidates = await projectsWithNoFutureSessions();
  const now = Date.now();
  for (const p of candidates) {
    // compute days since last session end
    const last = await SessionModel.find({ projectId: p._id })
      .sort({ endAtEpoch: -1 })
      .limit(1)
      .lean();
    const lastEnd = last[0]?.endAtEpoch;
    if (!lastEnd) continue;
    const days = Math.floor((now - lastEnd) / (24 * 60 * 60 * 1000));

    // T-10 warning
    if (days >= 20 && days < 21 && !p.closingWarn10At) {
      const owner = await User.findById(p.createdBy).lean();
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: "Project nearing auto-close in 10 days",
          html: projectClosingWarning10(p.name),
        });
        p.closingWarn10At = new Date();
        await p.save();
      }
    }

    // T-2 warning
    if (days >= 28 && days < 29 && !p.closingWarn2At) {
      const owner = await User.findById(p.createdBy).lean();
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: "Project will auto-close in 2 days",
          html: projectClosingWarning2(p.name),
        });
        p.closingWarn2At = new Date();
        await p.save();
      }
    }
  }
}

export async function closeIdleProjects() {
  const candidates = await projectsWithNoFutureSessions();
  const now = Date.now();
  for (const p of candidates) {
    const last = await SessionModel.find({ projectId: p._id })
      .sort({ endAtEpoch: -1 })
      .limit(1)
      .lean();
    const lastEnd = last[0]?.endAtEpoch;
    if (!lastEnd) continue;
    const days = Math.floor((now - lastEnd) / (24 * 60 * 60 * 1000));
    if (days >= 30 && p.status !== "Closed" && p.status !== "Archived") {
      p.status = "Closed" as any;
      p.recordingAccess = true;
      await p.save(); // pre-save hook sets closedAt
    }
  }
}

export async function archiveClosedProjects() {
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const threshold = new Date(Date.now() - sixtyDaysMs);
  const toArchive = await ProjectModel.find({
    status: "Closed",
    closedAt: { $lte: threshold },
  });
  for (const p of toArchive) {
    p.status = "Archived" as any;
    p.recordingAccess = false;
    await p.save();
  }
}
