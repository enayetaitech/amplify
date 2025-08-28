// src/processors/livekit/livekitService.ts
import { AccessToken, EgressClient, EncodedFileOutput, EncodingOptionsPreset, RoomServiceClient, S3Upload, SegmentedFileOutput, VideoGrant, WebhookReceiver } from 'livekit-server-sdk';
import config from '../../config';


const apiUrl   =  config.livekit_api_url!;   // HTTPS
const apiKey   =  config.livekit_api_key!;
const apiSecret=  config.livekit_api_secret!;

if (!apiUrl || !apiKey || !apiSecret) {
  throw new Error('LIVEKIT_API_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET must be set');
}
export type LivekitRole = 'Admin' | 'Moderator' | 'Participant' | 'Observer';

export const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
export const egressClient = new EgressClient(apiUrl, apiKey, apiSecret);
export const webhookReceiver = new WebhookReceiver(apiKey, apiSecret);

const s3Common = {
  accessKey: config.s3_access_key!,
  secretAccessKey: config.s3_secret_access_key!,
  bucket: config.s3_bucket_name!,
  region: config.s3_bucket_region!,
}

const cdnBase = ((config.hls_base_url || '').trim()).replace(/\/?$/, '/');



export async function issueRoomToken(params: {
  identity: string;          // user id
  name?: string;             // display name (optional)
  role: LivekitRole;
  roomName: string;
}) {
  const { identity, name, role, roomName } = params;
  
  const at = new AccessToken(apiKey, apiSecret, { identity, name });
  const grant: VideoGrant = { room: roomName, roomJoin: true, canSubscribe: true,
    canPublishData: true,   canPublish: role !== 'Observer'};

  if (role === 'Observer') {
    grant.canSubscribe = true;
    grant.canPublish = false;
    grant.canPublishData = true;
  } else {
    grant.canSubscribe = true;
    grant.canPublish = true;
    grant.canPublishData = true;
  }

  at.addGrant(grant);
  return await at.toJwt();
}


export async function ensureRoom(roomName: string) {
  try {
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 60 * 60,       // auto-close after 1h idle (tweak as you like)
      maxParticipants: 500,        // match your expected max
    });
  } catch (err: any) {
    // LiveKit throws if the room already exists — safe to ignore that case
    if (!String(err?.message || '').toLowerCase().includes('already exists')) {
      throw err;
    }
  }
}
/** stubs to wire into start/end session; we’ll fill these next */
export async function startHlsEgress(roomName: string): Promise<{
  egressId: string; playbackUrl: string | null; playlistName: string;
}> {
  const s3 = new S3Upload(s3Common);

  const segments = new SegmentedFileOutput({
    filenamePrefix: roomName,
    playlistName: 'index.m3u8',
    livePlaylistName: 'live.m3u8',
    segmentDuration: 2,
    output: { case: 's3', value: s3 },
  });

  const info = await egressClient.startRoomCompositeEgress(
    roomName,
    { segments },                                      
    { layout: 'grid', encodingOptions: EncodingOptionsPreset.H264_720P_30 } 
  );

  const playbackUrl = cdnBase ? `${cdnBase}${roomName}/live.m3u8` : null;

  

  return { egressId: info.egressId, playbackUrl, playlistName: 'live.m3u8' };
}

export async function stopHlsEgress(egressId?: string | null) {
  if (egressId) await egressClient.stopEgress(egressId);
}

export async function startFileEgress(roomName: string): Promise<{ egressId: string }> {
  const s3 = new S3Upload(s3Common);

  const file = new EncodedFileOutput({
    filepath: `${roomName}/{time}.mp4`,
    output: { case: 's3', value: s3 },
  });

  const info = await egressClient.startRoomCompositeEgress(
    roomName,
    file,
    { layout: 'grid', encodingOptions: EncodingOptionsPreset.H264_720P_30 }
  );

  

  return { egressId: info.egressId };
}

export async function stopFileEgress(egressId?: string | null) {
  if (egressId) await egressClient.stopEgress(egressId);
}