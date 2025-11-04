import { spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";
import { uploadFileToS3, getSignedUrl } from "../../utils/uploadToS3";

/**
 * Extract audio from MP4 video file (from S3) or HLS stream and upload as MP3.
 * Requires ffmpeg available on PATH in the server environment.
 */
export async function extractAudioFromVideoAndUpload(params: {
  videoS3Key?: string; // S3 key of MP4 file (if available)
  hlsUrl?: string; // HLS URL as fallback
  audioS3Key: string; // destination key for MP3
}): Promise<{ key: string }> {
  const { videoS3Key, hlsUrl, audioS3Key } = params;

  if (!videoS3Key && !hlsUrl) {
    throw new Error("Either videoS3Key or hlsUrl must be provided");
  }

  // Write to temporary file
  const tmpFile = path.join(
    os.tmpdir(),
    `audio_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`
  );

  // Capture ffmpeg output for debugging
  let ffmpegStderr = "";
  let ffmpegStdout = "";

  // Determine input source
  let inputSource: string;
  if (videoS3Key) {
    // Get signed URL for S3 MP4 file (valid for 5 minutes)
    inputSource = getSignedUrl(videoS3Key, 300);
  } else {
    // Use HLS URL directly
    inputSource = hlsUrl!;
  }

  // Spawn ffmpeg to extract audio
  const ffmpegArgs = ["-y"];

  // Add protocol whitelist for HLS
  if (hlsUrl && !videoS3Key) {
    ffmpegArgs.push("-protocol_whitelist", "file,http,https,tcp,tls,crypto");
  }

  ffmpegArgs.push(
    "-i",
    inputSource,
    // Extract audio only, encode as MP3
    "-vn", // no video
    "-acodec",
    "libmp3lame", // MP3 encoder
    "-b:a",
    "128k", // bitrate
    "-ar",
    "44100", // sample rate
    "-ac",
    "2", // stereo
    tmpFile
  );

  const ff = spawn("ffmpeg", ffmpegArgs, { stdio: ["ignore", "pipe", "pipe"] });

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
    console.error(`[AUDIO_EXTRACT] ffmpeg failed for ${videoS3Key || hlsUrl}`);
    console.error(`[AUDIO_EXTRACT] stderr: ${ffmpegStderr}`);
    console.error(`[AUDIO_EXTRACT] stdout: ${ffmpegStdout}`);
    throw new Error(
      `ffmpeg exited with code ${exitCode}. Input: ${
        videoS3Key || hlsUrl
      }. Error: ${ffmpegStderr.slice(-500)}`
    );
  }

  // Log duration info from ffmpeg output if available
  const durationMatch = ffmpegStderr.match(
    /Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/
  );
  if (durationMatch) {
    const [, hours, minutes, seconds] = durationMatch;
    const totalSeconds =
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    console.log(
      `[AUDIO_EXTRACT] Extracted audio duration: ${totalSeconds} seconds (${hours}:${minutes}:${seconds})`
    );
  }

  try {
    return await uploadFileToS3(tmpFile, audioS3Key, "audio/mpeg");
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {}
  }
}
