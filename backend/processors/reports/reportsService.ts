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

  // total credits used (derived from session durations):
  // minutes = ceil((end - start) / 60000), credits = minutes * 3
  const LiveSession =
    require("../../model/LiveSessionModel").LiveSessionModel ||
    require("../../model/LiveSessionModel").default ||
    require("../../model/LiveSessionModel");

  const creditsAgg = await LiveSession.aggregate([
    // join to sessions to filter by project
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
    // compute duration where both start and end exist
    {
      $addFields: {
        durationMs: {
          $cond: [
            {
              $and: [
                { $ifNull: ["$endTime", false] },
                { $ifNull: ["$startTime", false] },
              ],
            },
            { $subtract: ["$endTime", "$startTime"] },
            null,
          ],
        },
      },
    },
    // compute minutes rounded up and credits (null-safe)
    {
      $addFields: {
        minutesRounded: {
          $cond: [
            { $ifNull: ["$durationMs", false] },
            { $ceil: { $divide: ["$durationMs", 60000] } },
            0,
          ],
        },
      },
    },
    { $addFields: { creditsUsed: { $multiply: ["$minutesRounded", 3] } } },
    { $group: { _id: null, total: { $sum: "$creditsUsed" } } },
  ]).allowDiskUse(true);
  const totalCreditsUsed = (creditsAgg[0] && creditsAgg[0].total) || 0;

  // unique participants and observers across project derived from LiveSession lists

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

  // Count unique observers across sessions in this project using LiveSession.observerHistory
  // Build a stable observerKey (lowercase email or stringified id) and filter out empty keys
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
    {
      $unwind: { path: "$observerHistory", preserveNullAndEmptyArrays: false },
    },
    {
      $addFields: {
        observerKey: {
          $toLower: {
            $ifNull: [
              "$observerHistory.email",
              { $toString: "$observerHistory.id" },
            ],
          },
        },
      },
    },
    { $match: { observerKey: { $exists: true, $ne: "" } } },
    { $group: { _id: "$observerKey" } },
    { $count: "total" },
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
    // credits will be derived from rounded-up minutes of duration * 3
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
    // compute minutes rounded up and credits used
    {
      $addFields: {
        minutesRounded: {
          $cond: [
            { $ifNull: ["$durationMs", false] },
            { $ceil: { $divide: ["$durationMs", 60000] } },
            0,
          ],
        },
        totalCreditsUsed: {
          $multiply: [
            {
              $cond: [
                { $ifNull: ["$durationMs", false] },
                { $ceil: { $divide: ["$durationMs", 60000] } },
                0,
              ],
            },
            3,
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

  // Build enrichment from UserActivity (earliest join per email)
  const activityEmailToInfo: Record<
    string,
    {
      ip?: string;
      deviceType?: string;
      platform?: string;
      browser?: string;
      location?: string;
    }
  > = {};
  try {
    const UserActivityModel =
      require("../../model/UserActivityModel").UserActivityModel ||
      require("../../model/UserActivityModel").default ||
      require("../../model/UserActivityModel");
    const acts: Array<{
      email?: string;
      deviceInfo?: {
        ip?: string;
        deviceType?: string;
        platform?: string;
        browser?: string;
        location?: string;
      };
      joinTime?: Date;
    }> = await UserActivityModel.find(
      { sessionId: live?._id, role: "Participant" },
      { email: 1, deviceInfo: 1, joinTime: 1 }
    ).lean();
    // Keep first seen per lowercase email (implicitly earliest since created on join)
    for (const a of acts || []) {
      const key = (a?.email || "").toLowerCase();
      if (!key || activityEmailToInfo[key]) continue;
      const di = a?.deviceInfo || {};
      activityEmailToInfo[key] = {
        ip: di?.ip,
        deviceType: di?.deviceType,
        platform: di?.platform,
        browser: di?.browser,
        location: di?.location,
      };
    }
  } catch {}

  const paged = deduped.slice(skip, skip + limit).map((p: any) => {
    const key = String(p.email || "").toLowerCase();
    const extra = activityEmailToInfo[key] || {};
    return {
      name: p.name,
      email: p.email,
      userId: p.id ? String(p.id) : undefined,
      deviceType: extra.deviceType,
      device: extra.platform ? { os: extra.platform } : undefined,
      joinTime: p.joinedAt,
      leaveTime: p.leaveAt || undefined,
      ip: extra.ip,
      location: extra.location,
    };
  });

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

  const live = await LiveSession.findOne(
    {
      sessionId: new Types.ObjectId(sessionId),
    },
    { observerHistory: 1 }
  ).lean();

  // Use observerHistory entries (multiple records per observer possible)
  const history = Array.isArray((live as any)?.observerHistory)
    ? ((live as any).observerHistory as any[])
    : [];
  const total = history.length;

  // Build enrichment from UserActivity for observers
  const activityEmailToInfo: Record<
    string,
    {
      ip?: string;
      deviceType?: string;
      platform?: string;
      browser?: string;
      location?: string;
    }
  > = {};
  try {
    const UserActivityModel =
      require("../../model/UserActivityModel").UserActivityModel ||
      require("../../model/UserActivityModel").default ||
      require("../../model/UserActivityModel");
    const acts: Array<{
      email?: string;
      deviceInfo?: {
        ip?: string;
        deviceType?: string;
        platform?: string;
        browser?: string;
        location?: string;
      };
      joinTime?: Date;
    }> = await UserActivityModel.find(
      { sessionId: live?._id, role: "Observer" },
      { email: 1, deviceInfo: 1, joinTime: 1 }
    ).lean();
    for (const a of acts || []) {
      const key = (a?.email || "").toLowerCase();
      if (!key || activityEmailToInfo[key]) continue;
      const di = a?.deviceInfo || {};
      activityEmailToInfo[key] = {
        ip: di?.ip,
        deviceType: di?.deviceType,
        platform: di?.platform,
        browser: di?.browser,
        location: di?.location,
      };
    }
  } catch {}

  // Fetch user company information for observers
  const userEmailToCompany: Record<string, string> = {};
  try {
    const User = require("../../model/UserModel").default;
    const emails = [
      ...new Set(history.map((h: any) => h.email).filter(Boolean)),
    ];
    if (emails.length > 0) {
      const users = await User.find(
        { email: { $in: emails } },
        { email: 1, companyName: 1 }
      ).lean();
      for (const user of users || []) {
        if (user?.email && user?.companyName) {
          userEmailToCompany[user.email.toLowerCase()] = user.companyName;
        }
      }
      // Fallback to Moderator collection when User.companyName is missing
      try {
        // scope to the same project if available
        let projectPid: any = null;
        try {
          const Session =
            require("../../model/SessionModel").SessionModel ||
            require("../../model/SessionModel").default ||
            require("../../model/SessionModel");
          const sess = await Session.findById(new Types.ObjectId(sessionId))
            .select("projectId")
            .lean();
          projectPid = sess?.projectId
            ? new Types.ObjectId(String(sess.projectId))
            : null;
        } catch {}

        const modFilter: any = { email: { $in: emails } };
        if (projectPid) modFilter.projectId = projectPid;

        const moderators = await Moderator.find(modFilter, {
          email: 1,
          companyName: 1,
        }).lean();
        for (const m of moderators || []) {
          const em = (m as any)?.email
            ? String((m as any).email).toLowerCase()
            : "";
          const cn = (m as any)?.companyName
            ? String((m as any).companyName)
            : "";
          if (em && cn && !userEmailToCompany[em]) {
            userEmailToCompany[em] = cn;
          }
        }
      } catch {}
    }
  } catch {}

  const paged = history.slice(skip, skip + limit).map((h: any) => {
    const key = String(h.email || "").toLowerCase();
    const extra = activityEmailToInfo[key] || {};
    return {
      observerName: h.name,
      name: h.name,
      email: h.email,
      companyName: userEmailToCompany[key] || undefined,
      userId: h.id ? String(h.id) : undefined,
      joinTime: h.joinedAt,
      leaveTime: h.leaveAt || undefined,
      ip: extra.ip,
      deviceType: extra.deviceType,
      device: extra.platform ? { os: extra.platform } : undefined,
      location: extra.location,
    };
  });

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
  // Derive observers from LiveSession.observerHistory so we have join/leave timestamps
  const LiveSession =
    require("../../model/LiveSessionModel").LiveSessionModel ||
    require("../../model/LiveSessionModel").default ||
    require("../../model/LiveSessionModel");

  // total unique observers for project (dedupe by email or userId)
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
      $unwind: { path: "$observerHistory", preserveNullAndEmptyArrays: false },
    },
    {
      $group: {
        _id: {
          $toLower: {
            $ifNull: [
              "$observerHistory.email",
              { $toString: "$observerHistory.id" },
            ],
          },
        },
      },
    },
    { $count: "total" },
  ]).allowDiskUse(true);
  const total = (totalAgg[0] && totalAgg[0].total) || 0;

  // Aggregate unique observers with earliest joinedAt and sessions they attended
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
    {
      $unwind: { path: "$observerHistory", preserveNullAndEmptyArrays: false },
    },
    {
      $group: {
        _id: {
          $toLower: {
            $ifNull: [
              "$observerHistory.email",
              { $toString: "$observerHistory.id" },
            ],
          },
        },
        name: { $first: "$observerHistory.name" },
        email: { $first: "$observerHistory.email" },
        userId: { $first: "$observerHistory.id" },
        joinedAt: { $min: "$observerHistory.joinedAt" },
        sessions: {
          $addToSet: { id: "$session._id", title: "$session.title" },
        },
      },
    },
    { $sort: { joinedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]).allowDiskUse(true);

  // Fetch user company information for observers
  const userEmailToCompany: Record<string, string> = {};
  try {
    const User = require("../../model/UserModel").default;
    const emails = [
      ...new Set((itemsAgg || []).map((d: any) => d.email).filter(Boolean)),
    ];
    if (emails.length > 0) {
      const users = await User.find(
        { email: { $in: emails } },
        { email: 1, companyName: 1 }
      ).lean();
      for (const user of users || []) {
        if (user?.email && user?.companyName) {
          userEmailToCompany[user.email.toLowerCase()] = user.companyName;
        }
      }
      // Fallback to Moderator collection scoped to this project when User.companyName is missing
      try {
        const modFilter: any = { email: { $in: emails }, projectId: pid };
        const moderators = await Moderator.find(modFilter, {
          email: 1,
          companyName: 1,
        }).lean();
        for (const m of moderators || []) {
          const em = (m as any)?.email
            ? String((m as any).email).toLowerCase()
            : "";
          const cn = (m as any)?.companyName
            ? String((m as any).companyName)
            : "";
          if (em && cn && !userEmailToCompany[em]) {
            userEmailToCompany[em] = cn;
          }
        }
      } catch {}
    }
  } catch {}

  const finalItems = (itemsAgg || []).map((d: any) => ({
    _id: d._id && d._id.toString ? d._id.toString() : String(d._id),
    observerName: d.name,
    name: d.name,
    email: d.email,
    companyName: userEmailToCompany[d.email?.toLowerCase()] || undefined,
    joinedAt: d.joinedAt,
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
