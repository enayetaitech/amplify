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
export declare function uploadToS3(buffer: Buffer, mimeType: string, displayName: string): Promise<{
    url: string;
    key: string;
}>;
export declare function getSignedUrl(key: string, expiresSeconds?: number): string;
export declare function getSignedUrls(keys: string[], expiresSeconds?: number): {
    key: string;
    url: string;
}[];
export declare function deleteFromS3(key: string): Promise<void>;
//# sourceMappingURL=uploadToS3.d.ts.map