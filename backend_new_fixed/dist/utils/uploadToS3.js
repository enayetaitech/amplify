"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
exports.getSignedUrl = getSignedUrl;
exports.getSignedUrls = getSignedUrls;
exports.deleteFromS3 = deleteFromS3;
// utils/uploadToS3.ts  (TypeScript — works in JS if you drop the types)
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const config_1 = __importDefault(require("../config"));
/** One reusable S3 client (creds & region picked up from env vars) */
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: config_1.default.s3_access_key,
    secretAccessKey: config_1.default.s3_secret_access_key
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
function uploadToS3(buffer, mimeType, displayName) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `mediabox/${displayName}`;
        const Bucket = config_1.default.s3_bucket_name;
        const params = {
            Bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        };
        const { Location } = yield s3.upload(params).promise();
        return { url: Location, key };
    });
}
/* ───────────────────────────────────────────────────────────── */
/*  SINGLE DOWNLOAD HELPER                                      */
/*  — Returns a short-lived signed URL (default 2 min)          */
/* ───────────────────────────────────────────────────────────── */
function getSignedUrl(key, expiresSeconds = 120) {
    const Bucket = config_1.default.s3_bucket_name;
    return s3.getSignedUrl("getObject", {
        Bucket,
        Key: key,
        Expires: expiresSeconds,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(key.split("/").pop() || "download")}"`,
    });
}
/* ───────────────────────────────────────────────────────────── */
/*  MULTIPLE DOWNLOAD HELPER                                    */
/*  — Returns an array of { key, url } signed links             */
/* ───────────────────────────────────────────────────────────── */
function getSignedUrls(keys, expiresSeconds = 120) {
    return keys.map((k) => ({
        key: k,
        url: getSignedUrl(k, expiresSeconds),
    }));
}
/*───────────────────────────────────────────────────────────────────────────*/
/*  Delete helper                                                            */
/*───────────────────────────────────────────────────────────────────────────*/
function deleteFromS3(key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config_1.default.s3_bucket_name) {
            throw new Error("S3_BUCKET_NAME is not configured");
        }
        const Bucket = config_1.default.s3_bucket_name;
        yield s3
            .deleteObject({
            Bucket,
            Key: key,
        })
            .promise();
    });
}
