// src/processors/livekit/livekitService.ts
import config from "../../config/index";

import {
  AccessToken,
  EgressClient,
  EncodedFileType,
  EncodedFileOutput,
  RoomServiceClient,
  S3Upload,
  SegmentedFileOutput,
  TrackSource,
  TrackType,
  VideoGrant,
} from "livekit-server-sdk";

export type LivekitRole = "Admin" | "Moderator" | "Participant" | "Observer";

const apiKey = config.livekit_api_key!;
const apiSecret = config.livekit_api_secret!;

export const roomService = new RoomServiceClient(
  config.livekit_ws_url!, // LIVEKIT_HOST
  apiKey,
  apiSecret
);

// Egress client points to the same LiveKit host you already use.
// If your server requires https:// instead of wss://, most deployments accept the same base.
// You can also expose a dedicated HTTP URL in config later if needed.
const egress = new EgressClient(config.livekit_ws_url!, apiKey, apiSecret);

export async function issueRoomToken(params: {
  identity: string; // user id
  name?: string; // display name (optional)
  role: LivekitRole;
  roomName: string;
}) {
  const { identity, name, role, roomName } = params;

  // Include role as metadata so sockets can authorize easily.
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    metadata: JSON.stringify({ role }),
  });

  // Base grant applies to everyone who joins the room
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublishData: true,
    canPublish: role !== "Observer",
    // 👇 IMPORTANT: lock participant screenshare by default
    // Observers: []
    // Participants: MIC + CAMERA only
    // Admin/Moderator: MIC + CAMERA + SCREEN_SHARE (+ audio)
    canPublishSources:
      role === "Observer"
        ? []
        : role === "Participant"
        ? [TrackSource.MICROPHONE, TrackSource.CAMERA]
        : [
            TrackSource.MICROPHONE,
            TrackSource.CAMERA,
            TrackSource.SCREEN_SHARE,
            TrackSource.SCREEN_SHARE_AUDIO,
          ],
  };

  at.addGrant(grant);
  return await at.toJwt();
}

/** NEW: server-side moderation helper – mute a participant's microphone */
export async function serverMuteMicrophone(params: {
  roomName: string; // in your app this is the sessionId used when issuing the LK token
  identity: string; // use participantIdentity(sessionId, email)
}): Promise<boolean> {
  const { roomName, identity } = params;

  const participants = await roomService.listParticipants(roomName);
  const p = participants.find((pi) => pi.identity === identity);
  if (!p) return false;

  // find an audio pub (mic) and mute it
  const audioPub =
    (p.tracks || []).find(
      (t: any) =>
        t?.source === TrackSource.MICROPHONE || t?.type === TrackType.AUDIO
    ) || (p.tracks || [])[0];

  if (!audioPub?.sid) return false;

  await roomService.mutePublishedTrack(roomName, identity, audioPub.sid, true);
  return true;
}

/** NEW: server-side moderation helper – turn off (mute) a participant's camera */
export async function serverDisableCamera(params: {
  roomName: string;
  identity: string;
}): Promise<boolean> {
  const { roomName, identity } = params;

  const participants = await roomService.listParticipants(roomName);
  const p = participants.find((pi) => pi.identity === identity);
  if (!p) return false;

  // find a video pub (camera) and mute it
  const videoPub =
    (p.tracks || []).find(
      (t: any) =>
        t?.source === TrackSource.CAMERA || t?.type === TrackType.VIDEO
    ) || (p.tracks || [])[0];

  if (!videoPub?.sid) return false;

  await roomService.mutePublishedTrack(roomName, identity, videoPub.sid, true);
  return true;
}

/** NEW: server-side moderation helper – toggle  a participant's screenshare */
export async function serverAllowScreenshare(params: {
  roomName: string;
  identity: string;
  allow: boolean;
}): Promise<boolean> {
  const { roomName, identity, allow } = params;

  const participants = await roomService.listParticipants(roomName);
  const p = participants.find((pi) => pi.identity === identity);
  if (!p) return false;

  // participant.permission?.canPublishSources may be undefined/empty (meaning "all"),
  // but for Participants your grant uses an explicit list (MIC + CAMERA). Keep the pattern.  // ← see your token grant
  const prevPerm: any = (p as any).permission || {};
  const prevSources: TrackSource[] = prevPerm.canPublishSources ?? [];

  const add = [TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO];
  const nextSources = allow
    ? Array.from(new Set([...prevSources, ...add]))
    : prevSources.filter((s) => !add.includes(s));

  await roomService.updateParticipant(roomName, identity, {
    permission: { ...prevPerm, canPublishSources: nextSources },
  });

  // If revoking, also hard-stop any active screenshare tracks published by this participant.
  if (!allow) {
    for (const t of p.tracks || []) {
      if (
        t?.sid &&
        (t.source === TrackSource.SCREEN_SHARE ||
          t.source === TrackSource.SCREEN_SHARE_AUDIO)
      ) {
        await roomService.mutePublishedTrack(roomName, identity, t.sid, true);
      }
    }
  }
  return true;
}

export async function ensureRoom(
  roomName: string,
  opts?: {
    metadata?: any;
    emptyTimeout?: number; // seconds
    maxParticipants?: number;
  }
) {
  // Older SDK signature: listRooms(names?: string[])
  let existing = (await roomService.listRooms([roomName])).find(
    (r) => r.name === roomName
  );

  // (Optional) fallback for environments where listRooms() has no filter arg
  if (!existing) {
    const all = await roomService.listRooms();
    existing = all.find((r) => r.name === roomName);
  }

  if (existing) return existing;

  // Create if not found
  return await roomService.createRoom({
    name: roomName,
    emptyTimeout: opts?.emptyTimeout ?? 60 * 60, // 1 hour
    maxParticipants: opts?.maxParticipants ?? 300,
    metadata: opts?.metadata ? JSON.stringify(opts.metadata) : undefined,
  });
}

/** stubs to wire into start/end session; we’ll fill these next */
function hlsPaths(roomName: string) {
  const base =
    (config as any).hls_base_url || process.env.HLS_PUBLIC_BASE || ""; // HLS_CDN_BASE or HLS_PUBLIC_BASE
  const prefix = process.env.HLS_PREFIX || "hls";

  const dir = `${prefix}/${encodeURIComponent(roomName)}`;
  const playlistName = "index.m3u8";
  const livePlaylistName = "live.m3u8";

  return {
    filenamePrefix: `${dir}/segment`,
    playlistName,
    livePlaylistName,
    liveUrl: base
      ? `${base.replace(/\/+$/, "")}/${dir}/${livePlaylistName}`
      : null,
    vodUrl: base ? `${base.replace(/\/+$/, "")}/${dir}/${playlistName}` : null,
  };
}

export async function startHlsEgress(roomName: string): Promise<{
  egressId: string;
  playbackUrl: string | null;
  playlistName: string;
}> {
  // S3 creds from your config mapping
  const s3AccessKey = config.s3_access_key;
  const s3SecretKey = config.s3_secret_access_key;
  const s3Bucket = config.s3_bucket_name;
  const s3Region = config.s3_bucket_region;

  if (!s3AccessKey || !s3SecretKey || !s3Bucket || !s3Region) {
    throw new Error(
      "Missing S3 configuration (S3_ACCESS_KEY, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME, S3_REGION)."
    );
  }

  const { filenamePrefix, playlistName, livePlaylistName, liveUrl, vodUrl } =
    hlsPaths(roomName);

  // ✅ Use SegmentedFileOutput + S3Upload (defaults to HLS)
  const segments = new SegmentedFileOutput({
    filenamePrefix,
    playlistName,
    livePlaylistName,
    segmentDuration: 2,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: s3AccessKey,
        secret: s3SecretKey,
        bucket: s3Bucket,
        region: s3Region,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" || undefined,
      }),
    },
  });

  // ✅ layout goes in the 3rd arg; omit encodingOptions to avoid TS mismatch on your SDK
  const info = await egress.startRoomCompositeEgress(
    roomName,
    { segments },
    { layout: "grid" }
  );

  return {
    egressId: info.egressId!,
    playbackUrl: liveUrl, // observers should play this .m3u8
    playlistName: livePlaylistName, // "live.m3u8"
  };
}

export async function stopHlsEgress(egressId?: string | null) {
  if (!egressId) return;
  try {
    await egress.stopEgress(egressId);
  } catch (err) {
    // If already stopped, keep UX smooth
    console.warn(
      "stopHlsEgress: stopEgress error (ignored):",
      (err as any)?.message || err
    );
  }
}

export async function startFileEgress(
  roomName: string
): Promise<{ egressId: string }> {
  const s3AccessKey = config.s3_access_key;
  const s3SecretKey = config.s3_secret_access_key;
  const s3Bucket = config.s3_bucket_name;
  const s3Region = config.s3_bucket_region;

  if (!s3AccessKey || !s3SecretKey || !s3Bucket || !s3Region) {
    throw new Error(
      "Missing S3 configuration (S3_ACCESS_KEY, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME, S3_REGION)."
    );
  }

  const file = new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: s3AccessKey,
        secret: s3SecretKey,
        bucket: s3Bucket,
        region: s3Region,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" || undefined,
      }),
    },
  });

  const info = await egress.startRoomCompositeEgress(
    roomName,
    { file },
    { layout: "grid" }
  );
  return { egressId: info.egressId! };
}

export async function stopFileEgress(egressId?: string | null) {
  if (!egressId) return;
  try {
    await egress.stopEgress(egressId);
  } catch (err) {
    console.warn(
      "stopFileEgress: stopEgress error (ignored):",
      (err as any)?.message || err
    );
  }
}
