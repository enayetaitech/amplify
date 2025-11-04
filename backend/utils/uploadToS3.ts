// utils/uploadToS3.ts  (TypeScript — works in JS if you drop the types)
import AWS from "aws-sdk";
import config from "../config";
import { PassThrough } from "stream";
import fs from "fs";

/** One reusable S3 client (creds & region picked up from env vars)
 *  Ensure we use Signature Version 4 (AWS4-HMAC-SHA256) and the configured region.
 */
const s3 = new AWS.S3({
  accessKeyId: config.s3_access_key,
  secretAccessKey: config.s3_secret_access_key,
  region: config.s3_bucket_region,
  signatureVersion: "v4",
});

/**
 * Upload a Buffer to S3 under the `mediabox/` prefix.
 *
 * @param buffer      Raw file bytes (e.g. from multer.memoryStorage()).
 * @param mimeType    Content-Type, e.g. "video/mp4", "image/png".
 * @param displayName The filename you want to appear in S3 *unchanged*.
 *
 * @returns `{ url, key }`
 *          key → "mediabox/<displayName>"   (store in DB)
 *          url → public URL (works if bucket/prefix is public)
 */
export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  displayName: string
): Promise<{ url: string; key: string }> {
  const key = `mediabox/${displayName}`;
  const Bucket = config.s3_bucket_name as string;

  const params: AWS.S3.PutObjectRequest = {
    Bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  const { Location } = await s3.upload(params).promise();

  return { url: Location as string, key };
}

/* ───────────────────────────────────────────────────────────── */
/*  SINGLE DOWNLOAD HELPER                                      */
/*  — Returns a short-lived signed URL (default 2 min)          */
/* ───────────────────────────────────────────────────────────── */
export function getSignedUrl(key: string, expiresSeconds = 120): string {
  const Bucket = config.s3_bucket_name;

  return s3.getSignedUrl("getObject", {
    Bucket,
    Key: key,
    Expires: expiresSeconds,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
      key.split("/").pop() || "download"
    )}"`,
  });
}

/**
 * Generate a short-lived signed URL without forcing download, allowing inline preview in the browser.
 */
export function getSignedUrlInline(key: string, expiresSeconds = 120): string {
  const Bucket = config.s3_bucket_name as string;
  return s3.getSignedUrl("getObject", {
    Bucket,
    Key: key,
    Expires: expiresSeconds,
    // No ResponseContentDisposition → respect original Content-Type for inline display
  } as any);
}

/* ───────────────────────────────────────────────────────────── */
/*  MULTIPLE DOWNLOAD HELPER                                    */
/*  — Returns an array of { key, url } signed links             */
/* ───────────────────────────────────────────────────────────── */
export function getSignedUrls(
  keys: string[],
  expiresSeconds = 120
): { key: string; url: string }[] {
  return keys.map((k) => ({
    key: k,
    url: getSignedUrl(k, expiresSeconds),
  }));
}

/*───────────────────────────────────────────────────────────────────────────*/
/*  Delete helper                                                            */
/*───────────────────────────────────────────────────────────────────────────*/
export async function deleteFromS3(key: string): Promise<void> {
  if (!config.s3_bucket_name) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }
  const Bucket = config.s3_bucket_name;

  await s3
    .deleteObject({
      Bucket,
      Key: key,
    })
    .promise();
}

/*───────────────────────────────────────────────────────────────────────────*/
/*  Find latest object by prefix (optionally suffix filter)                   */
/*───────────────────────────────────────────────────────────────────────────*/
export async function findLatestObjectByPrefix(
  prefix: string,
  opts?: { suffix?: string }
): Promise<{ key: string; size: number } | null> {
  const Bucket = config.s3_bucket_name as string;
  let ContinuationToken: string | undefined = undefined;
  let latest: { key: string; size: number; last: Date } | null = null;
  const suffix = opts?.suffix ? String(opts.suffix) : undefined;

  do {
    const out = await s3
      .listObjectsV2({ Bucket, Prefix: prefix, ContinuationToken })
      .promise();
    for (const obj of out.Contents || []) {
      if (!obj.Key) continue;
      if (suffix && !obj.Key.endsWith(suffix)) continue;
      const last = obj.LastModified || new Date(0);
      const size = obj.Size || 0;
      if (!latest || last > latest.last) {
        latest = { key: obj.Key, size, last };
      }
    }
    ContinuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (ContinuationToken);

  return latest ? { key: latest.key, size: latest.size } : null;
}

/** Upload a streaming source (e.g., ffmpeg output) to S3. */
export async function uploadStreamToS3(
  key: string,
  contentType: string
): Promise<{ writeStream: PassThrough; done: Promise<{ key: string }> }> {
  const Bucket = config.s3_bucket_name as string;
  const pass = new PassThrough();
  const done = s3
    .upload({ Bucket, Key: key, Body: pass, ContentType: contentType })
    .promise()
    .then(() => ({ key }));
  return { writeStream: pass, done };
}

export async function headObjectSize(key: string): Promise<number | null> {
  try {
    const Bucket = config.s3_bucket_name as string;
    const out = await s3.headObject({ Bucket, Key: key }).promise();
    return typeof out.ContentLength === "number" ? out.ContentLength : null;
  } catch {
    return null;
  }
}

export async function uploadFileToS3(
  filePath: string,
  key: string,
  contentType: string
): Promise<{ key: string }> {
  const Bucket = config.s3_bucket_name as string;
  const Body = fs.createReadStream(filePath);
  await s3
    .upload({ Bucket, Key: key, Body, ContentType: contentType })
    .promise();
  return { key };
}
