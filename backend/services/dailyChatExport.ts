import { Types } from "mongoose";
import { SessionModel } from "../model/SessionModel";
import { LiveSessionModel } from "../model/LiveSessionModel";
import { ObserverProjectChatModel } from "../model/ObserverProjectChatModel";
import { SessionDeliverableModel } from "../model/SessionDeliverableModel";
import ProjectModel from "../model/ProjectModel";
import {
  buildS3Key,
  formatDeliverableFilename,
  uploadBufferToS3WithKey,
} from "../utils/deliverables";
import { baseLogger } from "../utils/logger";

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
    // Calculate last 24 hours date range (from 24 hours ago to now)
    const now = new Date();
    const exportEndTime = new Date(now.getTime() - 1000); // 1 second before now to avoid race conditions
    const exportStartTime = new Date(
      exportEndTime.getTime() - 24 * 60 * 60 * 1000
    ); // 24 hours before end time

    baseLogger.info(
      {
        now: now.toISOString(),
        exportStartTime: exportStartTime.toISOString(),
        exportEndTime: exportEndTime.toISOString(),
        note: "Exporting observer group chat messages from last 24 hours",
      },
      "Daily chat export: calculating date range (last 24 hours)"
    );

    // Find all sessions that overlapped with the last 24 hours
    // We need to check both scheduled times AND actual LiveSession times
    // because sessions may start/end at different times than scheduled

    // Get all sessions that have LiveSessions that overlapped with last 24 hours
    const liveSessionsLast24h = await LiveSessionModel.find({
      $or: [
        {
          startTime: {
            $gte: exportStartTime,
            $lte: exportEndTime,
          },
        },
        {
          endTime: {
            $gte: exportStartTime,
            $lte: exportEndTime,
          },
        },
        {
          $and: [
            { startTime: { $lte: exportStartTime } },
            {
              $or: [
                { endTime: { $gte: exportEndTime } },
                { endTime: null },
                { ongoing: true },
              ],
            },
          ],
        },
      ],
    })
      .populate("sessionId")
      .lean();

    // Also get sessions by scheduled times that overlapped with last 24 hours
    const sessionsByScheduled = await SessionModel.find({
      startAtEpoch: { $lte: exportEndTime.getTime() },
      $or: [
        { endAtEpoch: { $gte: exportStartTime.getTime() } },
        { endAtEpoch: null },
      ],
    })
      .populate("projectId")
      .lean();

    // Combine and deduplicate sessions
    const sessionIds = new Set<string>();
    const sessionsToProcess: typeof sessionsByScheduled = [];

    // Add sessions from LiveSession query first (these are sessions that actually ran)
    for (const live of liveSessionsLast24h) {
      const session = live.sessionId as any;
      if (session && session._id) {
        const id = String(session._id);
        if (!sessionIds.has(id)) {
          sessionIds.add(id);
          // Get full session with projectId populated
          const fullSession = await SessionModel.findById(session._id)
            .populate("projectId")
            .lean();
          if (fullSession) {
            sessionsToProcess.push(fullSession);
          }
        }
      }
    }

    // Add sessions from scheduled query (for sessions without LiveSession)
    for (const s of sessionsByScheduled) {
      const id = String(s._id);
      if (!sessionIds.has(id)) {
        sessionIds.add(id);
        sessionsToProcess.push(s);
      }
    }

    baseLogger.info(
      {
        sessionCount: sessionsToProcess.length,
        scheduledCount: sessionsByScheduled.length,
        liveSessionCount: liveSessionsLast24h.length,
        dateRange: {
          from: exportStartTime.toISOString(),
          to: exportEndTime.toISOString(),
        },
      },
      "Daily chat export: found sessions overlapping with last 24 hours"
    );

    // Group sessions by project
    const sessionsByProject = new Map<string, typeof sessionsToProcess>();
    for (const session of sessionsToProcess) {
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

      baseLogger.debug(
        {
          projectId: projectIdStr,
          sessionCount: sessions.length,
        },
        "Daily chat export: processing project"
      );

      // Get all project-level observer chat messages from last 24 hours
      const projectChatMessages = await ObserverProjectChatModel.find({
        projectId,
        timestamp: {
          $gte: exportStartTime,
          $lte: exportEndTime,
        },
        scope: "observer_project_group",
      })
        .sort({ timestamp: 1 })
        .lean();

      // Log total messages in database for this project (for debugging)
      const totalMessagesInProject =
        await ObserverProjectChatModel.countDocuments({
          projectId,
          scope: "observer_project_group",
        });

      baseLogger.debug(
        {
          projectId: projectIdStr,
          totalMessagesInProject,
          messagesInLast24h: projectChatMessages.length,
        },
        "Daily chat export: message counts for project"
      );

      baseLogger.info(
        {
          projectId: projectIdStr,
          messageCount: projectChatMessages.length,
          dateRange: {
            from: exportStartTime.toISOString(),
            to: exportEndTime.toISOString(),
          },
        },
        "Daily chat export: found project chat messages from last 24 hours"
      );

      if (projectChatMessages.length === 0) {
        baseLogger.debug(
          { projectId: projectIdStr },
          "Daily chat export: no messages to export for this project"
        );
        continue; // No messages to export for this project
      }

      // Get project name for filename
      const project = await ProjectModel.findById(projectId).lean();
      const projectName = project?.name || projectIdStr;
      const safeProjectName = (projectName || projectIdStr)
        .replace(/[^a-zA-Z0-9-_\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .substring(0, 50); // Limit length

      // Format date for filename (YYYY-MM-DD format)
      const dateStr = exportEndTime.toISOString().split("T")[0]; // YYYY-MM-DD

      // Create ONE deliverable per project with ALL messages from all sessions
      // Format: YYYY-MM-DD_BackChat_ProjectName.txt
      const filename = `${dateStr}_BackChat_${safeProjectName}.txt`;

      // Build S3 key at project level (not session level)
      const key = `projects/${projectIdStr}/backroom-chat/${filename}`;

      // Check if deliverable already exists for this project and date
      const existing = await SessionDeliverableModel.exists({
        projectId,
        type: "BACKROOM_CHAT",
        storageKey: key,
      });

      if (!existing) {
        // Sort all messages by timestamp
        const sortedMessages = projectChatMessages.sort((a, b) => {
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });

        // Format messages for deliverable with session context
        const lines: string[] = [
          `Backroom Chat — ${projectName}`,
          `Date: ${dateStr}`,
          `Total messages: ${sortedMessages.length}`,
          `Sessions: ${sessions.length}`,
          "",
        ];

        // Group messages by session for better readability
        for (const session of sessions) {
          const live = await LiveSessionModel.findOne({
            sessionId: session._id,
          }).lean();

          if (!live) continue;

          const sessionStartTime = live.startTime
            ? new Date(live.startTime)
            : session.startAtEpoch
            ? new Date(session.startAtEpoch)
            : exportStartTime;
          const sessionEndTime = live.endTime
            ? new Date(live.endTime)
            : live.ongoing === false && live.hlsStoppedAt
            ? new Date(live.hlsStoppedAt)
            : session.endAtEpoch
            ? new Date(session.endAtEpoch)
            : exportEndTime;

          const sessionMessages = sortedMessages.filter((msg) => {
            const msgTime = new Date(msg.timestamp);
            return msgTime >= sessionStartTime && msgTime <= sessionEndTime;
          });

          if (sessionMessages.length > 0) {
            lines.push(
              `--- Session: ${session.title || "Session"} (${
                sessionStartTime.toISOString().split("T")[0]
              }) ---`
            );
            for (const m of sessionMessages) {
              const time = new Date(m.timestamp).toISOString();
              lines.push(`[${time}] ${m.name}: ${m.content}`);
            }
            lines.push(""); // Empty line between sessions
          }
        }

        baseLogger.debug(
          {
            projectId: projectIdStr,
            projectName,
            messageCount: sortedMessages.length,
            sessionCount: sessions.length,
            filename,
            s3Key: key,
          },
          "Daily chat export: creating project-level deliverable"
        );

        const { key: s3Key, size } = await uploadBufferToS3WithKey(
          toText(lines),
          "text/plain",
          key
        );

        // Create deliverable - use first session's ID or null if no sessions
        // Note: This is a project-level deliverable, but SessionDeliverableModel requires sessionId
        const firstSession = sessions[0];
        const deliverable = await SessionDeliverableModel.create({
          sessionId: firstSession?._id || projectId, // Use first session or projectId as fallback
          projectId,
          type: "BACKROOM_CHAT",
          displayName: filename,
          size,
          storageKey: s3Key,
          uploadedBy:
            (firstSession?.moderators?.[0] as Types.ObjectId) || projectId, // Fallback to projectId if no moderator
        });

        baseLogger.info(
          {
            deliverableId: String(deliverable._id),
            projectId: projectIdStr,
            projectName,
            messageCount: sortedMessages.length,
            sessionCount: sessions.length,
            filename,
            s3Key,
            size,
          },
          "Daily chat export: project-level deliverable created successfully"
        );

        exported++;
      } else {
        baseLogger.debug(
          {
            projectId: projectIdStr,
            projectName,
            filename,
            s3Key: key,
          },
          "Daily chat export: deliverable already exists for this project and date, skipping"
        );
      }

      // Delete messages from last 24 hours (they're now archived in deliverables)
      // IMPORTANT: Only delete if we actually exported them for this project
      const wasExported =
        exported > 0 ||
        (await SessionDeliverableModel.exists({
          projectId,
          type: "BACKROOM_CHAT",
          storageKey: key,
        }));

      if (wasExported) {
        baseLogger.debug(
          {
            projectId: projectIdStr,
            dateRange: {
              from: exportStartTime.toISOString(),
              to: exportEndTime.toISOString(),
            },
            wasExported: wasExported,
            messagesToDelete: projectChatMessages.length,
          },
          "Daily chat export: deleting archived messages (exported successfully)"
        );

        const deleteResult = await ObserverProjectChatModel.deleteMany({
          projectId,
          timestamp: {
            $gte: exportStartTime,
            $lte: exportEndTime,
          },
          scope: "observer_project_group",
        });

        baseLogger.info(
          {
            projectId: projectIdStr,
            deletedCount: deleteResult.deletedCount || 0,
            exportedCount: exported,
            reason: "Messages exported to project-level deliverable",
          },
          "Daily chat export: messages deleted after successful export"
        );

        deleted += deleteResult.deletedCount || 0;
      } else if (projectChatMessages.length === 0) {
        baseLogger.debug(
          {
            projectId: projectIdStr,
          },
          "Daily chat export: no messages to delete (none found in date range)"
        );
      } else {
        baseLogger.warn(
          {
            projectId: projectIdStr,
            messageCount: projectChatMessages.length,
            sessionCount: sessions.length,
            exportedCount: exported,
          },
          "Daily chat export: SKIPPING deletion - messages found but NOT exported (deliverable already exists or error)"
        );
      }
    }

    // Also delete any messages older than last 24 hours (cleanup old data)
    const cutoffDate = new Date(exportStartTime);
    cutoffDate.setDate(cutoffDate.getDate() - 1); // Day before last 24 hours

    baseLogger.debug(
      {
        cutoffDate: cutoffDate.toISOString(),
        cutoffDateLocal: cutoffDate.toLocaleString(),
      },
      "Daily chat export: checking for old messages to cleanup"
    );

    const oldDeleteResult = await ObserverProjectChatModel.deleteMany({
      timestamp: { $lt: cutoffDate },
      scope: "observer_project_group",
    });

    if (oldDeleteResult.deletedCount && oldDeleteResult.deletedCount > 0) {
      baseLogger.info(
        {
          deletedCount: oldDeleteResult.deletedCount,
          cutoffDate: cutoffDate.toISOString(),
          note: "Deleted messages older than last 24 hours (cleanup)",
        },
        "Daily chat export: cleaned up old messages"
      );
    }

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
