// src/processors/livekit/livekitService.ts

export type LivekitRole = 'Admin' | 'Moderator' | 'Participant' | 'Observer';

export async function issueRoomToken(params: {
  identity: string;          // user id
  name?: string;             // display name (optional)
  role: string;
  roomName: string;
}) {
  
  return "hbjh";
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