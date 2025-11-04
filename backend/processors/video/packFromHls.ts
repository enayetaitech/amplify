import { spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";
import { uploadFileToS3 } from "../../utils/uploadToS3";

/**
 * Package HLS (index.m3u8) into MP4 using ffmpeg and upload directly to S3.
 * Requires ffmpeg available on PATH in the server environment.
 */
export async function packageHlsToMp4AndUpload(params: {
  hlsUrl: string; // public URL to index.m3u8
  s3Key: string; // destination key for MP4
}): Promise<{ key: string }> {
  const { hlsUrl, s3Key } = params;

  // Write to temporary file to ensure a seekable mp4 with moov at start
  const tmpFile = path.join(
    os.tmpdir(),
    `pack_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`
  );

  // Capture ffmpeg output for debugging
  let ffmpegStderr = "";
  let ffmpegStdout = "";

  // Spawn ffmpeg to read HLS and mux to MP4 (seekable)
  const ff = spawn(
    "ffmpeg",
    [
      "-y",
      "-protocol_whitelist",
      "file,http,https,tcp,tls,crypto",
      "-i",
      hlsUrl,
      // keep video as-is, transcode audio to AAC-LC for broad compatibility
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      "48000",
      "-ac",
      "2",
      // ensure moov atom at start for proper seeking
      "-movflags",
      "+faststart",
      tmpFile,
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  ff.stdout.on("data", (data) => {
    ffmpegStdout += data.toString();
  });

  ff.stderr.on("data", (data) => {
    ffmpegStderr += data.toString();
  });

  const exitCode: number = await new Promise((resolve) => {
    ff.on("close", (code) => resolve(code ?? 1));
  });
  
  if (exitCode !== 0) {
    console.error(`[HLS_PACKAGE] ffmpeg failed for ${hlsUrl}`);
    console.error(`[HLS_PACKAGE] stderr: ${ffmpegStderr}`);
    console.error(`[HLS_PACKAGE] stdout: ${ffmpegStdout}`);
    throw new Error(
      `ffmpeg exited with code ${exitCode}. URL: ${hlsUrl}. Error: ${ffmpegStderr.slice(-500)}`
    );
  }

  // Log duration info from ffmpeg output if available
  const durationMatch = ffmpegStderr.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
  if (durationMatch) {
    const [, hours, minutes, seconds] = durationMatch;
    const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    console.log(`[HLS_PACKAGE] Packaged video duration: ${totalSeconds} seconds (${hours}:${minutes}:${seconds})`);
  }

  try {
    return await uploadFileToS3(tmpFile, s3Key, "video/mp4");
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {}
  }
}
