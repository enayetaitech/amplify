'use client';

import { useEffect,  useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL!;
const SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

export default function QuickJoin() {
  const [jwt, setJwt] = useState<string>(''); // paste your backend JWT here
  const [roomName, setRoomName] = useState<string>('');
  const [role, setRole] = useState<'Moderator' | 'Participant'>('Moderator');
  const [lkToken, setLkToken] = useState<string | null>(null);

  // allow passing ?roomName=... via URL
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const n = q.get('roomName');
    if (n) setRoomName(n);
  }, []);

  async function getToken() {
    if (!jwt || !roomName) {
      alert('Paste your backend JWT and roomName'); return;
    }
    console.log('jwt', jwt);
    const res = await fetch(`${API_BASE}/api/v1/livekit/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',              // <— send cookies
      body: JSON.stringify({ roomName, role }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert(`Token failed: ${res.status} ${t}`); return;
    }
    const json = await res.json();
    setLkToken(json?.data?.token || json?.token || null);
  }

  return (
    <div className="p-4 space-y-4">
      {!lkToken ? (
        <div className="max-w-xl space-y-3">
          <h1 className="text-xl font-semibold">Quick Join (publish A/V)</h1>

          <label className="block">
            <div className="text-sm font-medium">Backend JWT (Moderator/Admin)</div>
            <input className="border p-2 w-full" value={jwt} onChange={e => setJwt(e.target.value)} placeholder="paste your backend JWT" />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Room name</div>
            <input className="border p-2 w-full" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="project_..._session_..." />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Role</div>
            <select className="border p-2 w-full" value={role} onChange={(e) => setRole(e.target.value as 'Moderator' | 'Participant')}>
              <option>Moderator</option>
              <option>Participant</option>
            </select>
          </label>

          <button onClick={getToken} className="px-4 py-2 rounded bg-black text-white">
            Get token & Join
          </button>

          <p className="text-sm text-gray-600">
            Tip: use the <code>roomName</code> you got when you started the meeting:
            <br />
            <code>{`project_<projectId>_session_<sessionId>`}</code>
          </p>
        </div>
      ) : (
        <LiveKitRoom
          serverUrl={SERVER_URL}
          token={lkToken}
          connect={true}
          video={true}
          audio={true}
        >
          <VideoConference />
        </LiveKitRoom>
      )}
    </div>
  );
}
