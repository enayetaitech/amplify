// src/processors/livekit/livekitService.ts
import config from "../../config/index";

import { AccessToken, TrackSource, VideoGrant } from "livekit-server-sdk";

export type LivekitRole = 'Admin' | 'Moderator' | 'Participant' | 'Observer';

const apiKey = config.livekit_api_key!;
const apiSecret = config.livekit_api_secret!;

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


export async function ensureRoom(roomName: string) {
 console.log(roomName)
}
/** stubs to wire into start/end session; we’ll fill these next */
export async function startHlsEgress(roomName: string): Promise<{
  egressId: string; playbackUrl: string | null; playlistName: string;
}> {
 

  
  return { egressId: '', playbackUrl: "hbjh", playlistName: 'live.m3u8' };
}

export async function stopHlsEgress(egressId?: string | null) {

}

export async function startFileEgress(roomName: string): Promise<{ egressId: string }> {
  

  return { egressId: '' };
}

export async function stopFileEgress(egressId?: string | null) {
  
}