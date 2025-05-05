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
