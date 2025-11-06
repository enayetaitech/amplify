import { Types } from "mongoose";
import { SessionModel } from "../model/SessionModel";
import { LiveSessionModel } from "../model/LiveSessionModel";
import { ObserverProjectChatModel } from "../model/ObserverProjectChatModel";
import { SessionDeliverableModel } from "../model/SessionDeliverableModel";
import {
  buildS3Key,
  formatDeliverableFilename,
  uploadBufferToS3WithKey,
} from "../utils/deliverables";

function toText(lines: string[]): Buffer {
  return Buffer.from(lines.join("\n"), "utf8");
}

/**
 * Export project-level observer chat to session deliverables and archive old messages
 * Runs daily at midnight to:
 * 1. Find all sessions that were active/ended in the previous day
 * 2. Export project-level observer chat messages for each session
 * 3. Delete messages older than current day to start fresh
 */
export async function exportDailyProjectChat(): Promise<{
  exported: number;
  deleted: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let exported = 0;
  let deleted = 0;

  try {
    // Calculate yesterday's date range (start of yesterday to end of yesterday)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Start of yesterday
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999); // End of yesterday

    // Find all sessions that overlapped with yesterday
    // Sessions that started before/on yesterday and ended after/on yesterday (or are still ongoing)
    const sessionsYesterday = await SessionModel.find({
      startAtEpoch: { $lte: endOfYesterday.getTime() },
      $or: [
        { endAtEpoch: { $gte: yesterday.getTime() } },
        { endAtEpoch: null },
      ],
    })
      .populate("projectId")
      .lean();

    // Group sessions by project
    const sessionsByProject = new Map<string, typeof sessionsYesterday>();
    for (const session of sessionsYesterday) {
      const pid =
        session.projectId instanceof Types.ObjectId
          ? String(session.projectId)
          : String((session.projectId as any)?._id || session.projectId);
      if (!sessionsByProject.has(pid)) {
        sessionsByProject.set(pid, []);
      }
      sessionsByProject.get(pid)!.push(session);
    }

    // Process each project
    for (const [projectIdStr, sessions] of sessionsByProject.entries()) {
      const projectId = new Types.ObjectId(projectIdStr);

      // Get all project-level observer chat messages from yesterday
      const projectChatMessages = await ObserverProjectChatModel.find({
        projectId,
        timestamp: {
          $gte: yesterday,
          $lte: endOfYesterday,
        },
        scope: "observer_project_group",
      })
        .sort({ timestamp: 1 })
        .lean();

      if (projectChatMessages.length === 0) {
        continue; // No messages to export for this project
      }

      // Export to each session's deliverables
      for (const session of sessions) {
        try {
          // Get session's LiveSession to find liveId
          const live = await LiveSessionModel.findOne({
            sessionId: session._id,
          }).lean();

          if (!live) {
            continue; // No LiveSession, skip
          }

          // Filter messages for this session's timeframe
          const sessionStartTime = session.startAtEpoch
            ? new Date(session.startAtEpoch)
            : yesterday;
          const sessionEndTime = session.endAtEpoch
            ? new Date(session.endAtEpoch)
            : endOfYesterday;

          const sessionMessages = projectChatMessages.filter((msg) => {
            const msgTime = new Date(msg.timestamp);
            return msgTime >= sessionStartTime && msgTime <= sessionEndTime;
          });

          if (sessionMessages.length === 0) {
            continue; // No messages for this session
          }

          // Format messages for deliverable
          const lines: string[] = [
            `Backroom Chat — ${session.title || "Session"}`,
            `Date: ${yesterday.toISOString().split("T")[0]}`,
            `Total messages: ${sessionMessages.length}`,
            "",
          ];

          for (const m of sessionMessages) {
            const time = new Date(m.timestamp).toISOString();
            lines.push(`[${time}] ${m.name}: ${m.content}`);
          }

          // Create deliverable
          const baseTs = session.startAtEpoch || Date.now();
          const filename = formatDeliverableFilename({
            baseTs,
            type: "BACKROOM_CHAT",
            sessionTitle: session.title || "Session",
            extension: ".txt",
          });

          const key = buildS3Key({
            projectId: session.projectId,
            sessionId: session._id,
            filename,
          });

          // Check if deliverable already exists
          const existing = await SessionDeliverableModel.exists({
            projectId: session.projectId,
            sessionId: session._id,
            type: "BACKROOM_CHAT",
            storageKey: key,
          });

          if (!existing) {
            const { key: s3Key, size } = await uploadBufferToS3WithKey(
              toText(lines),
              "text/plain",
              key
            );

            await SessionDeliverableModel.create({
              sessionId: session._id,
              projectId: session.projectId,
              type: "BACKROOM_CHAT",
              displayName: filename,
              size,
              storageKey: s3Key,
              uploadedBy:
                (session.moderators?.[0] as Types.ObjectId) ||
                session.projectId, // Fallback to projectId if no moderator
            });

            exported++;
          }
        } catch (err: unknown) {
          const errorMsg = `Failed to export chat for session ${session._id}: ${
            err instanceof Error ? err.message : String(err)
          }`;
          errors.push(errorMsg);
          console.error(errorMsg, err);
        }
      }

      // Delete messages from yesterday (they're now archived in deliverables)
      // This starts fresh for the new day
      const deleteResult = await ObserverProjectChatModel.deleteMany({
        projectId,
        timestamp: {
          $gte: yesterday,
          $lte: endOfYesterday,
        },
        scope: "observer_project_group",
      });

      deleted += deleteResult.deletedCount || 0;
    }

    // Also delete any messages older than yesterday (cleanup old data)
    const cutoffDate = new Date(yesterday);
    cutoffDate.setDate(cutoffDate.getDate() - 1); // Day before yesterday
    const oldDeleteResult = await ObserverProjectChatModel.deleteMany({
      timestamp: { $lt: cutoffDate },
      scope: "observer_project_group",
    });

    deleted += oldDeleteResult.deletedCount || 0;
  } catch (err: unknown) {
    const errorMsg = `Daily chat export failed: ${
      err instanceof Error ? err.message : String(err)
    }`;
    errors.push(errorMsg);
    console.error(errorMsg, err);
  }

  return { exported, deleted, errors };
}

