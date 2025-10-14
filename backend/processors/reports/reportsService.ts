import Project from "../../model/ProjectModel";
import Presence from "../../model/Presence";
import LiveUsageLog from "../../model/LiveUsageLog";
import Moderator from "../../model/ModeratorModel";
import { Types } from "mongoose";

export async function getProjectSummary(projectId: string) {
  const pid = new Types.ObjectId(projectId);

  // project basic
  const project = await Project.findById(pid).lean();
  if (!project) throw new Error("Project not found");

  // moderators union from sessions stored in project.moderators (ids)
  const moderators = Array.isArray(project.moderators)
    ? project.moderators
    : [];
  // Moderators are stored in the `moderators` collection (Moderator model)
  const moderatorDocs = await Moderator.find({ _id: { $in: moderators } })
    .select("firstName lastName")
    .lean();
  const allModeratorNames = moderatorDocs
    .map((m: any) => `${m.firstName || ""} ${m.lastName || ""}`.trim())
    .filter(Boolean);

  // total credits used
  const creditsAgg = await LiveUsageLog.aggregate([
    { $match: { projectId: pid } },
    { $group: { _id: null, total: { $sum: "$creditsUsed" } } },
  ]);
  const totalCreditsUsed = (creditsAgg[0] && creditsAgg[0].total) || 0;

  // unique participants and observers across project (exclude Amplify* roles & moderators)
  // unique participants and observers across project derived from LiveSession lists
  const LiveSession =
    require("../../model/LiveSessionModel").LiveSessionModel ||
    require("../../model/LiveSessionModel").default ||
    require("../../model/LiveSessionModel");

  // Count unique participants across project derived from participantHistory (dedupe by email)
  const participantsAgg = await LiveSession.aggregate([
    // join session to filter by project
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $addFields: { session: { $arrayElemAt: ["$session", 0] } } },
    { $match: { "session.projectId": pid } },
    // unwind participantHistory which may contain multiple entries per email
    {
      $unwind: {
        path: "$participantHistory",
        preserveNullAndEmptyArrays: false,
      },
    },
    // group by email to deduplicate (email is unique per user as requested)
    {
      $group: {
        _id: { $toLower: "$participantHistory.email" },
        email: { $first: "$participantHistory.email" },
      },
    },
    { $group: { _id: null, users: { $addToSet: "$email" } } },
    { $project: { total: { $size: "$users" } } },
  ]).allowDiskUse(true);
  const totalParticipantCount =
    (participantsAgg[0] && participantsAgg[0].total) || 0;

  const observersAgg = await LiveSession.aggregate([
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $addFields: { session: { $arrayElemAt: ["$session", 0] } } },
    { $match: { "session.projectId": pid } },
    { $unwind: { path: "$observerList", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: null,
        users: {
          $addToSet: {
            $ifNull: ["$observerList.userId", "$observerList.email"],
          },
        },
      },
    },
    { $project: { total: { $size: "$users" } } },
  ]).allowDiskUse(true);
  const totalObserverCount = (observersAgg[0] && observersAgg[0].total) || 0;

  return {
    projectName: project.name,
    allModeratorNames,
    startDateTime: project.startDate,
    totalCreditsUsed,
    closeDate:
      project.closedAt ||
      (project.status === "Closed" ? project.updatedAt : null),
    totalParticipantCount,
    totalObserverCount,
  };
}

export async function getProjectSessions(
  projectId: string,
  page: number,
  limit: number,
  sortBy?: string,
  sortDir?: "asc" | "desc",
  search?: string
) {
  const pid = new Types.ObjectId(projectId);
  const skip = (page - 1) * limit;

  const Session =
    require("../../model/SessionModel").SessionModel ||
    require("../../model/SessionModel").default ||
    require("../../model/SessionModel");

  // build base match
  const baseMatch: any = { projectId: pid };

  // pipeline to enrich sessions with moderator names, credits, participant and observer counts
  const enrichPipeline: any[] = [
    { $match: baseMatch },
    // join moderators
    {
      $lookup: {
        from: "moderators",
        localField: "moderators",
        foreignField: "_id",
        as: "moderatorDocs",
      },
    },
    {
      $addFields: {
        moderatorsNames: {
          $map: {
            input: "$moderatorDocs",
            as: "m",
            in: {
              $concat: [
                { $ifNull: ["$$m.firstName", ""] },
                " ",
                { $ifNull: ["$$m.lastName", ""] },
              ],
            },
          },
        },
      },
    },
    // credits (usage logs keyed by session._id)
    {
      $lookup: {
        from: "liveusagelogs",
        localField: "_id",
        foreignField: "sessionId",
        as: "usageLogs",
      },
    },
    { $addFields: { totalCreditsUsed: { $sum: "$usageLogs.creditsUsed" } } },
    // join live session doc to get participants/observers and start/end times
    {
      $lookup: {
        from: "livesessions",
        localField: "_id",
        foreignField: "sessionId",
        as: "liveSessionDocs",
      },
    },
    { $addFields: { liveSession: { $arrayElemAt: ["$liveSessionDocs", 0] } } },
    {
      $addFields: {
        participantCount: {
          $size: { $ifNull: ["$liveSession.participantsList", []] },
        },
        observerCount: {
          $size: { $ifNull: ["$liveSession.observerList", []] },
        },
        // prefer liveSession start/end times when available
        startDate: { $ifNull: ["$liveSession.startTime", "$startDate"] },
        endDate: { $ifNull: ["$liveSession.endTime", "$endDate"] },
        // duration in milliseconds when both start and end are available
        durationMs: {
          $cond: [
            {
              $and: [
                { $ifNull: ["$liveSession.endTime", false] },
                { $ifNull: ["$liveSession.startTime", false] },
              ],
            },
            { $subtract: ["$liveSession.endTime", "$liveSession.startTime"] },
            null,
          ],
        },
      },
    },
    {
      $project: {
        title: 1,
        moderatorsNames: 1,
        liveSession: 1,
        startDate: 1,
        endDate: 1,
        durationMs: 1,
        totalCreditsUsed: 1,
        participantCount: 1,
        observerCount: 1,
      },
    },
  ];

  // apply search if provided (match against title or moderator names)
  if (search && typeof search === "string" && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    enrichPipeline.unshift({
      $match: {
        projectId: pid,
        $or: [{ title: { $regex: regex } }, { name: { $regex: regex } }],
      },
    });
  }

  // pagination + sort via facet to get total count
  const sortStage = {} as any;
  if (sortBy) sortStage[sortBy] = sortDir === "asc" ? 1 : -1;
  else sortStage["startDate"] = -1;

  const facetPipeline = [
    { $sort: sortStage },
    { $skip: skip },
    { $limit: limit },
  ];

  const pipeline = [
    ...enrichPipeline,
    {
      $facet: {
        items: facetPipeline,
        total: [{ $count: "total" }],
      },
    },
  ];

  const agg = await Session.aggregate(pipeline).allowDiskUse(true);
  const items = (agg[0] && agg[0].items) || [];
  const total =
    (agg[0] && agg[0].total && agg[0].total[0] && agg[0].total[0].total) || 0;

  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
    hasPrev: page > 1,
    hasNext: page * limit < total,
  };

  return { items, meta };
}

export async function getSessionParticipants(
  sessionId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;

  const LiveSession =
    require("../../model/LiveSessionModel").LiveSessionModel ||
    require("../../model/LiveSessionModel").default ||
    require("../../model/LiveSessionModel");

  const live = await LiveSession.findOne({
    sessionId: new Types.ObjectId(sessionId),
  }).lean();
  // Prefer participantHistory for session participants and dedupe by email
  const history =
    live && Array.isArray(live.participantHistory)
      ? live.participantHistory
      : [];

  // Deduplicate by lowercase email, keep earliest joinedAt per email
  const byEmail: Record<string, any> = {};
  for (const entry of history) {
    if (!entry || !entry.email) continue;
    const key = String(entry.email).toLowerCase();
    if (!byEmail[key]) {
      byEmail[key] = { ...entry };
    } else {
      const existing = byEmail[key];
      const entryJoined = entry.joinedAt ? new Date(entry.joinedAt) : null;
      const existingJoined = existing.joinedAt
        ? new Date(existing.joinedAt)
        : null;
      if (entryJoined && (!existingJoined || entryJoined < existingJoined)) {
        byEmail[key] = { ...existing, ...entry };
      }
    }
  }

  const deduped = Object.values(byEmail);
  const total = deduped.length;

  const paged = deduped.slice(skip, skip + limit).map((p: any) => ({
    name: p.name,
    email: p.email,
    userId: p.id ? String(p.id) : undefined,
    deviceType: undefined,
    device: undefined,
    joinTime: p.joinedAt,
    leaveTime: p.leaveAt || undefined,
    ip: undefined,
  }));

  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
    hasPrev: page > 1,
    hasNext: page * limit < total,
  };

  return { items: paged, meta };
}

export async function getSessionObservers(
  sessionId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;

  const LiveSession =
    require("../../model/LiveSessionModel").LiveSessionModel ||
    require("../../model/LiveSessionModel").default ||
    require("../../model/LiveSessionModel");

  const live = await LiveSession.findOne({
    sessionId: new Types.ObjectId(sessionId),
  }).lean();

  const observers =
    live && Array.isArray(live.observerList) ? live.observerList : [];
  const total = observers.length;

  const paged = observers.slice(skip, skip + limit).map((o: any) => ({
    observerName: o.name,
    name: o.name,
    email: o.email,
    companyName: undefined,
    userId: o.userId ? String(o.userId) : undefined,
    joinTime: o.joinedAt,
    leaveTime: undefined,
  }));

  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
    hasPrev: page > 1,
    hasNext: page * limit < total,
  };

  return { items: paged, meta };
}

export async function getObserverSummary(
  observerIdOrEmail: string,
  projectId: string
) {
  const projectOid = new Types.ObjectId(projectId);
  const Presence = require("../../model/Presence").default;

  // observerId may be an ObjectId or an email string
  const isObjectId = Types.ObjectId.isValid(observerIdOrEmail);

  const match: any = { projectId: projectOid, role: "Observer" };
  if (isObjectId) match.userId = new Types.ObjectId(observerIdOrEmail);
  else match.email = observerIdOrEmail;

  // list sessions they joined with durations
  const agg = [
    { $match: match },
    {
      $project: {
        sessionId: 1,
        joinTime: 1,
        leaveTime: 1,
        durationMs: { $subtract: ["$leaveTime", "$joinTime"] },
      },
    },
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $addFields: { session: { $arrayElemAt: ["$session", 0] } } },
    {
      $project: {
        sessionId: 1,
        joinTime: 1,
        leaveTime: 1,
        durationMs: 1,
        sessionName: "$session.title",
      },
    },
    { $sort: { joinTime: -1 } },
  ];

  const sessions = await Presence.aggregate(agg).allowDiskUse(true);

  return { observerIdOrEmail, sessions };
}

export async function getProjectParticipants(
  projectId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  const pid = new Types.ObjectId(projectId);

  const LiveSession =
    require("../../model/LiveSessionModel").LiveSessionModel ||
    require("../../model/LiveSessionModel").default ||
    require("../../model/LiveSessionModel");

  // Count distinct participants across live sessions tied to sessions in this project
  // but derive participants from participantHistory and dedupe by email
  const totalAgg = await LiveSession.aggregate([
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $addFields: { session: { $arrayElemAt: ["$session", 0] } } },
    { $match: { "session.projectId": pid } },
    {
      $unwind: {
        path: "$participantHistory",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: { $toLower: "$participantHistory.email" },
        email: { $first: "$participantHistory.email" },
      },
    },
    { $count: "total" },
  ]).allowDiskUse(true);

  const total = (totalAgg[0] && totalAgg[0].total) || 0;

  // Aggregate unique participants with name/email and earliest joinedAt from participantHistory
  const itemsAgg = await LiveSession.aggregate([
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $addFields: { session: { $arrayElemAt: ["$session", 0] } } },
    { $match: { "session.projectId": pid } },
    // unwind participantHistory entries
    {
      $unwind: {
        path: "$participantHistory",
        preserveNullAndEmptyArrays: false,
      },
    },
    // group by lowercase email to dedupe
    {
      $group: {
        _id: { $toLower: "$participantHistory.email" },
        name: { $first: "$participantHistory.name" },
        email: { $first: "$participantHistory.email" },
        userId: { $first: "$participantHistory.id" },
        joinedAt: { $min: "$participantHistory.joinedAt" },
        sessions: {
          $addToSet: { id: "$session._id", title: "$session.title" },
        },
      },
    },
    { $sort: { joinedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]).allowDiskUse(true);

  const finalItems = (itemsAgg || []).map((d: any) => ({
    _id: d._id && d._id.toString ? d._id.toString() : String(d._id),
    name: d.name,
    email: d.email,
    joinedAt: d.joinedAt,
    // sessions is an array of { id, title } from the aggregation
    sessions: (d.sessions || []).map((s: any) => ({
      _id: s && s.id && s.id.toString ? s.id.toString() : String(s && s.id),
      title: s && s.title ? s.title : undefined,
    })),
  }));

  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
    hasPrev: page > 1,
    hasNext: page * limit < total,
  };

  return { items: finalItems, meta };
}

export async function getProjectObservers(
  projectId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  const pid = new Types.ObjectId(projectId);
  const Presence = require("../../model/Presence").default;

  const totalAgg = await Presence.aggregate([
    { $match: { projectId: pid, role: "Observer" } },
    {
      $group: {
        _id: null,
        users: { $addToSet: { $ifNull: ["$userId", "$email"] } },
      },
    },
    { $project: { total: { $size: "$users" } } },
  ]).allowDiskUse(true);
  const total = (totalAgg[0] && totalAgg[0].total) || 0;

  const agg = [
    { $match: { projectId: pid, role: "Observer" } },
    {
      $group: {
        _id: { observerKey: { $ifNull: ["$userId", "$email"] } },
        observerName: { $first: "$name" },
        email: { $first: "$email" },
        companyName: { $first: "$companyName" },
        joinedAt: { $min: "$joinedAt" },
      },
    },
    { $sort: { joinedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const items = await Presence.aggregate(agg).allowDiskUse(true);

  const meta = {
    page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
    hasPrev: page > 1,
    hasNext: page * limit < total,
  };

  return { items, meta };
}
