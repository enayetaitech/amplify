// utils/uploadToS3.ts  (TypeScript — works in JS if you drop the types)
import AWS from "aws-sdk";
import config from "../config";

/** One reusable S3 client (creds & region picked up from env vars) */
const s3 = new AWS.S3({
  accessKeyId:     config.s3_access_key,
  secretAccessKey: config.s3_secret_access_key
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
  const key   = `mediabox/${displayName}`;
  const Bucket = config.s3_bucket_name as string;

  const params: AWS.S3.PutObjectRequest = {
    Bucket,
    Key:  key,
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
export function getSignedUrl(
  key: string,
  expiresSeconds = 120
): string {
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