// backend/processors/waiting/waitingService.ts
import { LiveSessionModel } from "../../model/LiveSessionModel";

/** Load lists for UI panels */
export async function listState(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId }).lean();
  if (!live) throw new Error("LiveSession not found");

  return {
    participantsWaitingRoom: live.participantWaitingRoom ?? [],
    observersWaitingRoom: live.observerWaitingRoom ?? [],
    participantList: live.participantsList ?? [],
    observerList: live.observerList ?? [],
  };
}

/** Admit a single participant (by email) from waiting → active */
export async function admitByEmail(sessionId: string, email: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  
  if (!live) throw new Error("LiveSession not found");

  const i = live.participantWaitingRoom.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (i >= 0) {
    const user = live.participantWaitingRoom[i];
    // remove from waiting
    live.participantWaitingRoom.splice(i, 1);
    // add to active list
    live.participantsList.push({
      name: user.name,
      email: user.email,
      role: user.role,
      joinedAt: new Date(),
    });
    await live.save();
  }
  return {
    participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom: live.observerWaitingRoom,
    participantList: live.participantsList,
    observerList: live.observerList,
  };
}

/** Remove from waiting room (do not admit) */
export async function removeFromWaitingByEmail(sessionId: string, email: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  live.participantWaitingRoom = live.participantWaitingRoom.filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase()
  ) as any;

  await live.save();
  return {
    participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom: live.observerWaitingRoom,
    participantList: live.participantsList,
    observerList: live.observerList,
  };
}

/** Admit all participants currently waiting */
export async function admitAll(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  const now = new Date();
  const toAdmit = [...live.participantWaitingRoom];
  live.participantWaitingRoom = [];
  for (const user of toAdmit) {
    live.participantsList.push({
      name: user.name,
      email: user.email,
      role: user.role,
      joinedAt: now,
    });
  }
  await live.save();

  return {
    participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom: live.observerWaitingRoom,
    participantList: live.participantsList,
    observerList: live.observerList,
  };
}
