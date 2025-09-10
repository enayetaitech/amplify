// hooks/useEnqueueWaitingRoom.ts
"use client";

import { useCallback } from "react";
import api from "lib/api";

export interface EnqueuePayload {
  sessionId: string;
  name: string;
  email: string;
  role: "Participant" | "Moderator" | "Observer";
  device?: string;
  passcode?: string;
}

export function useEnqueueWaitingRoom() {
  const enqueue = useCallback(async (payload: EnqueuePayload) => {
    const res = await api.post(`/api/v1/waiting-room/enqueue`, payload);
    return res.data;
  }, []);

  return { enqueue };
}
