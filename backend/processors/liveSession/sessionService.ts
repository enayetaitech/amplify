// backend/processors/sessionService.ts

import { ClientSession, Types } from "mongoose";
import { LiveSessionModel } from "../../model/LiveSessionModel";
import { UserActivityModel } from "../../model/UserActivityModel";
import ChatMessageModel from "../../model/ChatModel";
import GroupMessageModel from "../../model/GroupMessage";
import ObserverGroupMessageModel from "../../model/ObserverGroupMessage";
import { ParticipantWaitingRoomChatModel } from "../../model/ParticipantWaitingRoomChatModel";

export interface EnqueueUserData {
  userId?: string;
  name: string;
  email: string;
  role: "Participant" | "Observer" | "Moderator" | "Admin";
}

export interface RequestDeviceInfo {
  ip: string;
  deviceType: string;
  platform: string;
  browser: string;
  location: string;
}

/**
 * Ensure there is a LiveSession for the given scheduled session.
 * If none exists, create it with ongoing=false.
 */
export async function createLiveSession(
  sessionId: string,
  options?: { session?: ClientSession }
) {
  // include the session on the query (so even findOne is under txn)
  const live = await LiveSessionModel.findOne(
    { sessionId: new Types.ObjectId(sessionId) },
    null,
    { session: options?.session }
  );
  if (live) return live;
  // create with the session option
  const [created] = await LiveSessionModel.create(
    [
      {
        sessionId: new Types.ObjectId(sessionId),
        ongoing: false,
      },
    ],
    { session: options?.session }
  );

  return created;
}

/**
 * Add a user to the waiting room and record their join in UserActivity.
 */
export async function enqueueUser(
  sessionId: string,
  userData: EnqueueUserData,
  deviceInfo?: RequestDeviceInfo
) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  // 🛑 skip if already in waiting room
  if (
    userData.role === "Participant" &&
    (live.participantWaitingRoom.some((u) => u.email === userData.email) ||
      live.participantsList.some((u) => u.email === userData.email))
  ) {
    return {
      participantsWaitingRoom: live.participantWaitingRoom,
      observersWaitingRoom: live.observerWaitingRoom,
      participantList: live.participantsList,
      observerList: live.observerList,
    };
  }
  // Add to waiting room
  if (userData.role === "Participant") {
    live.participantWaitingRoom.push({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      joinedAt: new Date(),
    });
  } else if (userData.role === "Observer") {
    live.observerWaitingRoom.push({
      userId: userData.userId || undefined,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      joinedAt: new Date(),
    });
  } else if (userData.role === "Moderator" || userData.role === "Admin") {
    const email = userData.email;
    if (
      live.observerList.some((u) => u.email === email) ||
      live.participantsList.some((u) => u.email === email)
    ) {
      return {
        participantsWaitingRoom: live.participantWaitingRoom,
        observersWaitingRoom: live.observerWaitingRoom,
        participantList: live.participantsList,
        observerList: live.observerList,
      };
    }

    live.observerList.push({
      userId: userData.userId || undefined,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });
    live.participantsList.push({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      joinedAt: new Date(),
    });
  }

  await live.save();

  // Log join in activity
  await UserActivityModel.create({
    sessionId: live._id,
    userId: userData.userId ? new Types.ObjectId(userData.userId) : undefined,
    email: userData.email,
    role: userData.role,
    joinTime: new Date(),
    deviceInfo: deviceInfo
      ? {
          ip: deviceInfo.ip,
          deviceType: deviceInfo.deviceType,
          platform: deviceInfo.platform,
          browser: deviceInfo.browser,
          location: deviceInfo.location,
        }
      : undefined,
  });

  return {
    participantsWaitingRoom: live.participantWaitingRoom,
    observersWaitingRoom: live.observerWaitingRoom,
    participantList: live.participantsList,
    observerList: live.observerList,
  };
}

/**
 * Mark the LiveSession as started.
 */
export async function startSession(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  live.ongoing = true;
  live.startTime = new Date();
  await live.save();

  return live;
}

/**
 * Mark the LiveSession as ended and record endTime.
 */
export async function endSession(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  live.ongoing = false;
  live.endTime = new Date();
  await live.save();

  return live;
}

/**
 * Fetch consolidated session history:
 *  • liveSession metadata
 *  • all join/leave activities
 *  • all waiting-room chats
 *  • all in-meeting direct and group chats
 */
export async function getSessionHistory(sessionId: string) {
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  const liveId = live._id;

  // Join/leave activity
  const activities = await UserActivityModel.find({ sessionId: liveId }).lean();

  // Waiting-room chats
  const waitingRoomChats = await ParticipantWaitingRoomChatModel.find({
    sessionId: liveId,
  }).lean();

  // In-meeting direct chats (1:1)
  const directChats = await ChatMessageModel.find({
    sessionId: liveId,
  }).lean();

  // In-meeting participant group chats
  const groupChats = await GroupMessageModel.find({
    sessionId: liveId,
  }).lean();

  // In-meeting observer group chats
  const observerChats = await ObserverGroupMessageModel.find({
    sessionId: liveId,
  }).lean();

  return {
    liveSession: live.toObject(),
    activities,
    waitingRoomChats,
    directChats,
    groupChats,
    observerChats,
  };
}

export async function logLeave(
  sessionId: string,
  userId: string
): Promise<void> {
  // Find the LiveSession to get its _id
  const live = await LiveSessionModel.findOne({ sessionId });
  if (!live) throw new Error("LiveSession not found");

  // Find the most recent activity without a leaveTime
  const activity = await UserActivityModel.findOne({
    sessionId: live._id,
    userId: new Types.ObjectId(userId),
    leaveTime: { $exists: false },
  }).sort({ joinTime: -1 });

  if (activity) {
    activity.leaveTime = new Date();
    await activity.save();
  }
}
