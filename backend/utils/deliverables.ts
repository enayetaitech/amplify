import AWS from "aws-sdk";
import { Types } from "mongoose";
import config from "../config";

export type DeliverableType =
  | "AUDIO"
  | "VIDEO"
  | "TRANSCRIPT"
  | "BACKROOM_CHAT"
  | "SESSION_CHAT"
  | "WHITEBOARD"
  | "POLL_RESULT";

const s3 = new AWS.S3({
  accessKeyId: config.s3_access_key,
  secretAccessKey: config.s3_secret_access_key,
  region: config.s3_bucket_region,
  signatureVersion: "v4",
});

export function safeSessionName(raw: string): string {
  return (raw || "Session")
    .replace(/[^a-zA-Z0-9-_\s]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTimestampForFilename(epochMs: number): string {
  const d = new Date(epochMs);
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const yy = String(d.getUTCFullYear()).slice(-2);
  let hours = d.getUTCHours();
  const minutes = pad2(d.getUTCMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = pad2(hours);
  return `${mm}${dd}${yy}_${hh}${minutes}${ampm}`;
}

export function formatDeliverableFilename(params: {
  baseTs: number; // epoch ms
  type: DeliverableType;
  sessionTitle: string;
  extension: string; // includes dot e.g. .mp4, .txt, .png, .csv, .m3u8
  indexSuffix?: number | null; // for multiple images etc.
}): string {
  const ts = formatTimestampForFilename(params.baseTs);
  const typeLabel =
    params.type === "BACKROOM_CHAT"
      ? "BackChat"
      : params.type === "SESSION_CHAT"
      ? "SessChat"
      : params.type === "POLL_RESULT"
      ? "Polls"
      : params.type === "WHITEBOARD"
      ? "Whiteboards"
      : params.type === "VIDEO"
      ? "Video"
      : params.type === "AUDIO"
      ? "Audio"
      : params.type === "TRANSCRIPT"
      ? "Transcript"
      : String(params.type);
  const name = safeSessionName(params.sessionTitle);
  const idx =
    params.indexSuffix && params.indexSuffix > 0
      ? `-${params.indexSuffix}`
      : "";
  return `${ts}_${typeLabel}_${name}${idx}${params.extension}`;
}

export function buildS3Key(params: {
  projectId: Types.ObjectId | string;
  sessionId: Types.ObjectId | string;
  filename: string;
}): string {
  const project = String(params.projectId);
  const session = String(params.sessionId);
  return `projects/${project}/sessions/${session}/${params.filename}`;
}

export async function uploadBufferToS3WithKey(
  buffer: Buffer,
  mimeType: string,
  key: string
): Promise<{ url: string; key: string; size: number }> {
  const Bucket = config.s3_bucket_name as string;
  const params: AWS.S3.PutObjectRequest = {
    Bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };
  const { Location } = await s3.upload(params).promise();
  return { url: Location as string, key, size: buffer.byteLength };
}
