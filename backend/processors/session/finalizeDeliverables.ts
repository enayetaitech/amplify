import { Types } from "mongoose";
import { SessionModel } from "../../model/SessionModel";
import { LiveSessionModel } from "../../model/LiveSessionModel";
import { SessionDeliverableModel } from "../../model/SessionDeliverableModel";
import GroupMessageModel from "../../model/GroupMessage";
import ObserverGroupMessageModel from "../../model/ObserverGroupMessage";
import { PollRunModel } from "../../model/PollRun";
import { aggregateResults } from "../poll/pollService";
import { renderAndStoreWhiteboardSnapshot } from "../whiteboard/renderSnapshot";
import {
  buildS3Key,
  formatDeliverableFilename,
  uploadBufferToS3WithKey,
} from "../../utils/deliverables";
import { findLatestObjectByPrefix } from "../../utils/uploadToS3";
import { packageHlsToMp4AndUpload } from "../video/packFromHls";
import https from "https";
import http from "http";
import { URL } from "url";

// Utility: simple CSV escaper
function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toText(lines: string[]): Buffer {
  return Buffer.from(lines.join("\n"), "utf8");
}

/**
 * Construct VOD URL from live playback URL
 * Converts: https://cdn.example.com/hls/roomName/live.m3u8
 * To: https://cdn.example.com/hls/roomName/index.m3u8
 */
function getVodUrlFromLiveUrl(liveUrl: string): string {
  if (!liveUrl) return liveUrl;
  // Replace live.m3u8 with index.m3u8
  return liveUrl.replace(/\/live\.m3u8$/i, "/index.m3u8");
}

/**
 * Make HTTP request (GET) using Node.js built-in modules
 */
function httpGet(url: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;
    
    const req = client.get(
      url,
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, text: data });
        });
      }
    );
    
    req.on("error", (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

/**
 * Wait for HLS VOD playlist to be available with retries
 * LiveKit needs time to finalize the index.m3u8 after stopping egress
 */
async function waitForHlsPlaylistAvailable(
  vodUrl: string,
  maxRetries = 5,
  delayMs = 3000
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await httpGet(vodUrl);
      if (response.status === 200) {
        const text = response.text;
        // VOD playlist should have EXT-X-ENDLIST tag or multiple segments
        if (text.includes("EXT-X-ENDLIST") || text.split("#EXTINF").length > 2) {
          return true;
        }
      }
    } catch (e) {
      // Playlist not ready yet
    }
    
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

export async function finalizeSessionDeliverables(
  sessionId: string,
  endedBy: string | Types.ObjectId
): Promise<void> {
  const session = await SessionModel.findById(sessionId).lean();
  if (!session) return;
  const live = await LiveSessionModel.findOne({
    sessionId: session._id,
  }).lean();

  const baseRaw = Number(session.startAtEpoch || Date.now());
  const baseTs = baseRaw > 1e12 ? baseRaw : baseRaw * 1000; // tolerate sec vs ms
  const projectId = session.projectId;
  const sessionTitle = session.title || "Session";

  // 1) Register Video deliverable (prefer MP4 file egress result; fallback HLS VOD playlist)
  const videoTasks: Promise<any>[] = [];
  if (live) {
    const roomName = String(session._id);
    // Primary: MP4 produced by file egress under known prefix we set in startFileEgress()
    let mp4: { key: string; size: number } | null = await findLatestObjectByPrefix(
      `recordings/${encodeURIComponent(roomName)}/`,
      { suffix: ".mp4" }
    );
    if (!mp4) {
      mp4 = await findLatestObjectByPrefix(`${encodeURIComponent(roomName)}-`, {
        suffix: ".mp4",
      });
    }
    if (mp4) {
      const filename = formatDeliverableFilename({
        baseTs,
        type: "VIDEO",
        sessionTitle,
        extension: ".mp4",
      });
      const exists = await SessionDeliverableModel.exists({
        projectId,
        sessionId: session._id,
        type: "VIDEO",
        storageKey: mp4.key,
      });
      if (!exists) {
        await SessionDeliverableModel.create({
          sessionId: session._id,
          projectId,
          type: "VIDEO",
          displayName: filename,
          size: mp4.size,
          storageKey: mp4.key,
          uploadedBy: (endedBy as any) || session.moderators?.[0],
        });
      }
    } else if (live.hlsPlaybackUrl) {
      // Fallback: package HLS to MP4 via ffmpeg and upload to S3
      try {
        const filename = formatDeliverableFilename({
          baseTs,
          type: "VIDEO",
          sessionTitle,
          extension: ".mp4",
        });
        const mp4Key = buildS3Key({
          projectId,
          sessionId: session._id,
          filename,
        });
        const exists = await SessionDeliverableModel.exists({
          projectId,
          sessionId: session._id,
          type: "VIDEO",
          storageKey: mp4Key,
        });
        if (!exists) {
          // Wait for HLS VOD playlist to be finalized after egress stop
          // LiveKit needs time (usually 3-10 seconds) to finalize index.m3u8
          const vodUrl = getVodUrlFromLiveUrl(live.hlsPlaybackUrl);
          
          console.log(`[DELIVERABLES] Waiting for HLS VOD playlist: ${vodUrl}`);
          const playlistReady = await waitForHlsPlaylistAvailable(vodUrl, 8, 5000);
          
          if (!playlistReady) {
            console.warn(
              `[DELIVERABLES] HLS VOD playlist not ready after retries for session ${sessionId}, attempting anyway`
            );
          } else {
            console.log(`[DELIVERABLES] HLS VOD playlist ready for session ${sessionId}`);
          }
          
          const out = await packageHlsToMp4AndUpload({
            hlsUrl: vodUrl,
            s3Key: mp4Key,
          });
          const objSize = await (
            await import("../../utils/uploadToS3")
          ).headObjectSize(out.key);
          await SessionDeliverableModel.create({
            sessionId: session._id,
            projectId,
            type: "VIDEO",
            displayName: filename,
            size: objSize || 0,
            storageKey: out.key,
            uploadedBy: (endedBy as any) || session.moderators?.[0],
          });
          console.log(`[DELIVERABLES] Successfully packaged HLS to MP4 for session ${sessionId}`);
        }
      } catch (e) {
        try {
          console.error(
            `[DELIVERABLES] HLS to MP4 packaging failed for session ${sessionId}:`,
            e
          );
        } catch {}
      }
    }
  }

  // 2) Export Session Chat (participants/main) and Backroom Chat (observer)
  const chatTasks = (async () => {
    const liveId = live?._id;
    if (!liveId) return;
    // Session Chat: GroupMessageModel scope typically "meeting_group" or similar. We'll grab all.
    const sessionChats = await GroupMessageModel.find({
      sessionId: liveId,
    })
      .sort({ timestamp: 1 })
      .lean();

    const backroomChats = await ObserverGroupMessageModel.find({
      sessionId: liveId,
    })
      .sort({ timestamp: 1 })
      .lean();

    if (sessionChats.length) {
      const lines: string[] = [
        `Session Chat — ${sessionTitle}`,
        `Total messages: ${sessionChats.length}`,
        "",
      ];
      for (const m of sessionChats) {
        const time = new Date((m as any).timestamp || Date.now()).toISOString();
        lines.push(`[${time}] ${(m as any).name}: ${(m as any).content}`);
      }
      const filename = formatDeliverableFilename({
        baseTs,
        type: "SESSION_CHAT",
        sessionTitle,
        extension: ".txt",
      });
      const key = buildS3Key({ projectId, sessionId: session._id, filename });
      const existing = await SessionDeliverableModel.exists({
        projectId,
        sessionId: session._id,
        type: "SESSION_CHAT",
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
          projectId,
          type: "SESSION_CHAT",
          displayName: filename,
          size,
          storageKey: s3Key,
          uploadedBy: (endedBy as any) || session.moderators?.[0],
        });
      }
    }

    if (backroomChats.length) {
      const lines: string[] = [
        `Backroom Chat — ${sessionTitle}`,
        `Total messages: ${backroomChats.length}`,
        "",
      ];
      for (const m of backroomChats) {
        const time = new Date((m as any).timestamp || Date.now()).toISOString();
        lines.push(`[${time}] ${(m as any).name}: ${(m as any).content}`);
      }
      const filename = formatDeliverableFilename({
        baseTs,
        type: "BACKROOM_CHAT",
        sessionTitle,
        extension: ".txt",
      });
      const key = buildS3Key({ projectId, sessionId: session._id, filename });
      const existing = await SessionDeliverableModel.exists({
        projectId,
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
          projectId,
          type: "BACKROOM_CHAT",
          displayName: filename,
          size,
          storageKey: s3Key,
          uploadedBy: (endedBy as any) || session.moderators?.[0],
        });
      }
    }
  })();

  // 3) Poll Results CSV (combined across runs)
  const pollTasks = (async () => {
    const runs = await PollRunModel.find({ sessionId: session._id })
      .sort({ runNumber: 1 })
      .lean();
    if (!runs.length) return;
    const lines: string[] = [
      [
        "runNumber",
        "runId",
        "questionId",
        "optionValue",
        "count",
        "total",
        "percent",
      ]
        .map(csvEscape)
        .join(","),
    ];
    for (const run of runs) {
      const agg = await aggregateResults(String(run.pollId), String(run._id));
      const qIds = Object.keys(agg);
      for (const qid of qIds) {
        const total = agg[qid].total || 0;
        for (const row of agg[qid].counts || []) {
          const pct = total > 0 ? (row.count / total) * 100 : 0;
          lines.push(
            [
              run.runNumber,
              String(run._id),
              qid,
              row.value,
              row.count,
              total,
              `${pct.toFixed(1)}%`,
            ]
              .map(csvEscape)
              .join(",")
          );
        }
      }
    }
    const filename = formatDeliverableFilename({
      baseTs,
      type: "POLL_RESULT",
      sessionTitle,
      extension: ".csv",
    });
    const key = buildS3Key({ projectId, sessionId: session._id, filename });
    const existing = await SessionDeliverableModel.exists({
      projectId,
      sessionId: session._id,
      type: "POLL_RESULT",
      storageKey: key,
    });
    if (!existing) {
      const { key: s3Key, size } = await uploadBufferToS3WithKey(
        toText(lines),
        "text/csv",
        key
      );
      await SessionDeliverableModel.create({
        sessionId: session._id,
        projectId,
        type: "POLL_RESULT",
        displayName: filename,
        size,
        storageKey: s3Key,
        uploadedBy: (endedBy as any) || session.moderators?.[0],
      });
    }
  })();

  // 4) Whiteboard snapshot from stored strokes (if any)
  const wbTask = renderAndStoreWhiteboardSnapshot({
    wbSessionId: String(session._id),
    projectId,
    sessionId: session._id,
    baseTs,
    sessionTitle,
    takenBy: (endedBy as any) || session.moderators?.[0],
  }).catch(() => undefined);

  await Promise.all([chatTasks, pollTasks, wbTask, ...videoTasks]);
}
