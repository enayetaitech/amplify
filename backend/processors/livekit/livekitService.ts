// src/processors/livekit/livekitService.ts
import config from "../../config/index";

import { AccessToken, EgressClient, RoomServiceClient, S3Upload, SegmentedFileOutput, TrackSource, TrackType, VideoGrant } from "livekit-server-sdk";

export type LivekitRole = 'Admin' | 'Moderator' | 'Participant' | 'Observer';
// Track active HLS egress per room so we can stop on End
const activeEgressByRoom = new Map();

const apiKey = config.livekit_api_key!;
const apiSecret = config.livekit_api_secret!;

export const roomService = new RoomServiceClient(
  config.livekit_api_url!, // LIVEKIT_HOST
  apiKey,
  apiSecret
);

const egress = new EgressClient(config.livekit_api_url!, config.livekit_api_key!, config.livekit_api_secret!);

export async function issueRoomToken(params: {
  identity: string;          // user id
  name?: string;             // display name (optional)
  role: LivekitRole;
  roomName: string;
}) {
  const { identity, name, role, roomName } = params;

  // Include role as metadata so sockets can authorize easily.
  const at = new AccessToken(apiKey, apiSecret, { identity, name, metadata: JSON.stringify({ role }) });

  // Base grant applies to everyone who joins the room
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublishData: true,
    canPublish: role !== 'Observer',
    // 👇 IMPORTANT: lock participant screenshare by default
    // Observers: []
    // Participants: MIC + CAMERA only
    // Admin/Moderator: MIC + CAMERA + SCREEN_SHARE (+ audio)
    canPublishSources:
      role === 'Observer'
        ? []
        : role === 'Participant'
        ? [TrackSource.MICROPHONE, TrackSource.CAMERA]
        : [TrackSource.MICROPHONE, TrackSource.CAMERA, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO],
  };

  at.addGrant(grant);
  return await at.toJwt();
}


/** NEW: server-side moderation helper – mute a participant's microphone */
export async function serverMuteMicrophone(params: {
  roomName: string;      // in your app this is the sessionId used when issuing the LK token
  identity: string;      // use participantIdentity(sessionId, email)
}): Promise<boolean> {
  const { roomName, identity } = params;

  const participants = await roomService.listParticipants(roomName);
  const p = participants.find((pi) => pi.identity === identity);
  if (!p) return false;

  // find an audio pub (mic) and mute it
  const audioPub =
    (p.tracks || []).find(
      (t: any) => t?.source === TrackSource.MICROPHONE || t?.type === TrackType.AUDIO
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
      (t: any) => t?.source === TrackSource.CAMERA || t?.type === TrackType.VIDEO
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
  const p = participants.find(pi => pi.identity === identity);
  if (!p) return false;

  // participant.permission?.canPublishSources may be undefined/empty (meaning "all"),
  // but for Participants your grant uses an explicit list (MIC + CAMERA). Keep the pattern.  // ← see your token grant
  const prevPerm: any = (p as any).permission || {};
  const prevSources: TrackSource[] = prevPerm.canPublishSources ?? [];

  const add = [TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO];
  const nextSources = allow
    ? Array.from(new Set([...prevSources, ...add]))
    : prevSources.filter(s => !add.includes(s));

  await roomService.updateParticipant(roomName, identity, {
    permission: { ...prevPerm, canPublishSources: nextSources },
  });

  // If revoking, also hard-stop any active screenshare tracks published by this participant.
  if (!allow) {
    for (const t of (p.tracks || [])) {
      if (t?.sid && (t.source === TrackSource.SCREEN_SHARE || t.source === TrackSource.SCREEN_SHARE_AUDIO)) {
        await roomService.mutePublishedTrack(roomName, identity, t.sid, true);
      }
    }
  }
  return true;
}

export async function ensureRoom(roomName: string) {
 try {
  const room = await roomService.createRoom({
    name: roomName,
    emptyTimeout: 60 * 60,
    maxParticipants: 500,
  })
  return room;
 } catch (_) {
  
 }
}

const HLS_PUBLIC_BASE = config.hls_base_url;
const HLS_PREFIX =  "hls";

export function hlsPaths(roomName: string) {
  const dir = `${HLS_PREFIX}/${encodeURIComponent(roomName)}`;

  return {
    filenamePrefix: `${dir}/segment`,
    playlistName: "index.m3u8",
    livePlaylistName: "live.m3u8",
    liveUrl: HLS_PUBLIC_BASE ? `${HLS_PUBLIC_BASE}/${dir}/live.m3u8` : null,
    vodUrl: HLS_PUBLIC_BASE ? `${HLS_PUBLIC_BASE}/${dir}/index.m3u8` : null,
  };
}

/** stubs to wire into start/end session; we’ll fill these next */
export async function startHlsEgress(roomName: string): Promise<{
  egressId: string; playbackUrl: string | null; playlistName: string;
}> {
  const { filenamePrefix, playlistName, livePlaylistName } = hlsPaths(roomName);

const segments = new SegmentedFileOutput({
  filenamePrefix,
    playlistName,
    livePlaylistName,
    segmentDuration: 2,
    output: {
      case: 's3',
      value: new S3Upload({
        accessKey: config.s3_access_key,
        secret: config.s3_secret_access_key,
        bucket: config.s3_bucket_name,
        region: config.s3_bucket_region,
        endpoint: config.s3_endpoint || undefined,
        forcePathStyle: config.s3_force_path_style === 'true' || undefined,
      })
    }
})

const info = await egress.startRoomCompositeEgress(
  roomName, {segments}, {layout: 'grid'}  // pick 'speaker' / 'single-speaker' / 'grid-light' if you prefer
)

console.log('egress info', info)

return { egressId: info.egressId, playbackUrl: info.segmentResults[0].livePlaylistName, playlistName: info.segmentResults[0].playlistName };
}

export async function stopHlsEgress(egressId?: string | null) {

}

export async function startFileEgress(roomName: string): Promise<{ egressId: string }> {
  

  return { egressId: '' };
}

export async function stopFileEgress(egressId?: string | null) {
  
}