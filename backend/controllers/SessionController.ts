import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../utils/ErrorHandler";
import { ISessionDocument, SessionModel } from "../model/SessionModel";
import ProjectModel from "../model/ProjectModel";
import ModeratorModel from "../model/ModeratorModel";
import {
  resolveToIana,
  toTimestampStrict,
} from "../processors/session/sessionTimeConflictChecker";
import * as sessionService from "../processors/liveSession/sessionService";
import mongoose from "mongoose";
import { LiveSessionModel } from "../model/LiveSessionModel";

// !  the fields you really need to keep the payload light
const SESSION_POPULATE = [
  { path: "moderators", select: "firstName lastName email" },
  { path: "projectId", select: "service" },
];

export const createSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { projectId, sessions } = req.body;

  // 1. Basic payload validation
  if (!Array.isArray(sessions) || sessions.length === 0 || !projectId) {
    return next(
      new ErrorHandler(
        "Sessions array, project id information are required",
        400
      )
    );
  }

  // 2. Project existence check
  const project = await ProjectModel.findById(projectId);

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }
  // ✅ Display label from DB (keep storing this)
  const displayTimeZone = project.defaultTimeZone as string;

  // ✅ IANA for math
  const ianaTimeZone = resolveToIana(displayTimeZone);
  if (!ianaTimeZone) {
    return next(
      new ErrorHandler(
        `Project time zone "${displayTimeZone}" is not recognized.`,
        400
      )
    );
  }

  // 3. Moderator existence check

  const modIds = Array.from(new Set(sessions.flatMap((s) => s.moderators)));

  const allMods = await ModeratorModel.find({
    _id: { $in: modIds },
  });

  if (allMods.length !== modIds.length) {
    return next(new ErrorHandler("One or more moderators not found", 404));
  }

  // 4. Pull all existing sessions for this project (lean + select only needed fields)
  const existing = await SessionModel.find({ projectId })
    .select("title startAtEpoch endAtEpoch")
    .lean();

  // 5. Validate no overlaps

  // Precompute epochs for new sessions and check intra-batch overlaps
  type NewSess = (typeof sessions)[number] & {
    startAtEpoch: number;
    endAtEpoch: number;
  };

  const newSessions: NewSess[] = [];

  for (const s of sessions) {
    const startAtEpoch = toTimestampStrict(s.date, s.startTime, ianaTimeZone);
    const endAtEpoch = startAtEpoch + s.duration * 60_000;
    newSessions.push({ ...s, startAtEpoch, endAtEpoch });
  }

  // Intra-batch overlap check (optimized: sort then check neighbors)
  newSessions.sort((a, b) => a.startAtEpoch - b.startAtEpoch);
  for (let i = 0; i < newSessions.length; i++) {
    for (let j = i + 1; j < newSessions.length; j++) {
      const a = newSessions[i];
      const b = newSessions[j];
      // Early exit: if b starts after a ends, no overlap and all subsequent j's will also not overlap
      if (b.startAtEpoch >= a.endAtEpoch) break;
      if (a.startAtEpoch < b.endAtEpoch && b.startAtEpoch < a.endAtEpoch) {
        return next(
          new ErrorHandler(
            `Session "${a.title}" time conflicts with session "${b.title}" in this request`,
            409
          )
        );
      }
    }
  }

  // Check against existing sessions (optimized: use stored epochs directly)
  for (const s of newSessions) {
    for (const ex of existing) {
      // Use stored epochs directly (timezone is locked at project level, so stored epochs are correct)
      const startEx = ex.startAtEpoch;
      const endEx = ex.endAtEpoch;
      if (s.startAtEpoch < endEx && startEx < s.endAtEpoch) {
        return next(
          new ErrorHandler(
            `Session "${s.title}" time conflicts with existing "${ex.title}"`,
            409
          )
        );
      }
    }
  }

  // 6. Map each session, injecting the shared fields
  const docs = newSessions.map((s: any) => ({
    projectId,
    timeZone: displayTimeZone,
    breakoutRoom: project.defaultBreakoutRoom ?? false,
    title: s.title,
    date: s.date,
    startTime: s.startTime,
    duration: s.duration,
    startAtEpoch: s.startAtEpoch,
    endAtEpoch: s.endAtEpoch,
    moderators: s.moderators,
  }));

  // 7. Bulk insert into MongoDB
  // ─── START TRANSACTION ────────────────────────────────────────────
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  let created: ISessionDocument[];

  try {
    created = await SessionModel.insertMany(docs, { session: mongoSession });

    // Bulk upsert LiveSessions for all created sessions within the same transaction
    if (created.length > 0) {
      const ops = created.map((sess) => ({
        updateOne: {
          filter: { sessionId: sess._id },
          update: {
            $setOnInsert: {
              sessionId: sess._id,
              ongoing: false,
            },
          },
          upsert: true,
        },
      }));
      await LiveSessionModel.bulkWrite(ops as any, { session: mongoSession });
    }

    project.meetings.push(...created.map((s) => s._id));
    // Auto-activate project when the first sessions are scheduled
    if (project.status === "Draft") {
      project.status = "Active" as any;
    }
    await project.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    // 8. Send uniform success response
    sendResponse(res, created, "Sessions created", 201);
  } catch (err) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    return next(err);
  } finally {
    mongoSession.endSession();
  }
};

/**
 * GET /sessions/project/:projectId
 * Fetch all sessions for a given project
 */
export const getSessionsByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    // ── pagination params ───────────────────────────────────────
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);

    const skip = (page - 1) * limit;

    // ── sorting params ──────────────────────────────────────────
    const sortByRaw = (req.query.sortBy as string) || "startAtEpoch";
    const sortOrderRaw = (req.query.sortOrder as string) || "asc";
    const allowedSortFields = new Set(["title", "startAtEpoch", "moderator"]);
    const sortField = allowedSortFields.has(sortByRaw)
      ? sortByRaw
      : "startAtEpoch";
    const sortDir = sortOrderRaw === "desc" ? -1 : 1;
    const sortSpec: Record<string, 1 | -1> =
      sortField === "title" ? { title: sortDir } : { startAtEpoch: sortDir };

    // ── parallel queries: data + count ─────────────────────────
    const totalPromise = SessionModel.countDocuments({ projectId });

    let sessions: any[];
    if (sortField === "moderator") {
      // Use aggregation to sort by the first moderator's name alphabetically (lastName, firstName)
      sessions = await SessionModel.aggregate([
        {
          $match: {
            projectId: new (mongoose as any).Types.ObjectId(projectId),
          },
        },
        {
          $lookup: {
            from: "moderators",
            localField: "moderators",
            foreignField: "_id",
            as: "moderators",
          },
        },
        {
          $addFields: {
            _mods: { $ifNull: ["$moderators", []] },
          },
        },
        {
          $addFields: {
            _firstMod: { $arrayElemAt: ["$_mods", 0] },
          },
        },
        {
          $addFields: {
            moderatorNames: {
              $map: {
                input: "$_mods",
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
        {
          $addFields: {
            _firstModName: {
              $concat: [
                { $toLower: { $ifNull: ["$_firstMod.lastName", ""] } },
                " ",
                { $toLower: { $ifNull: ["$_firstMod.firstName", ""] } },
              ],
            },
          },
        },
        // join project to shape `projectId` like populate select { service }
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "_project",
          },
        },
        { $unwind: { path: "$_project", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            projectId: {
              _id: "$_project._id",
              service: "$_project.service",
            },
          },
        },
        { $sort: { _firstModName: sortDir } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _mods: 0,
            _firstMod: 0,
            _firstModName: 0,
            _project: 0,
          },
        },
      ]).exec();
    } else {
      // Fetch sessions and enrich each with any existing LiveSession data
      const baseSessions = await SessionModel.find({ projectId })
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .populate(SESSION_POPULATE)
        .lean();

      // Find live sessions for these session ids in one query
      const sessionIds = baseSessions.map((b: any) => b._id);
      const liveSessions = await LiveSessionModel.find({
        sessionId: { $in: sessionIds },
      })
        .lean()
        .exec();

      const liveBySession = new Map<string, any>();
      for (const ls of liveSessions) {
        liveBySession.set(String(ls.sessionId), ls);
      }

      sessions = baseSessions.map((b: any) => {
        const ls = liveBySession.get(String(b._id));
        if (!ls) return b;

        // participant count: prefer unique emails from history or participantsList
        let participantCount = 0;
        const pHistory = Array.isArray(ls.participantHistory)
          ? ls.participantHistory
          : [];
        const pList = Array.isArray(ls.participantsList)
          ? ls.participantsList
          : [];
        if (pHistory.length > 0) {
          const emails = new Set<string>();
          for (const p of pHistory) {
            const em = (p?.email || "").toString().toLowerCase();
            if (em) emails.add(em);
          }
          participantCount = emails.size;
        } else if (pList.length > 0) {
          const emails = new Set<string>();
          for (const p of pList) {
            const em = (p?.email || "").toString().toLowerCase();
            if (em) emails.add(em);
          }
          participantCount = emails.size;
        }

        // observer count: prefer observerHistory length else observerList
        let observerCount = 0;
        const oHistory = Array.isArray(ls.observerHistory)
          ? ls.observerHistory
          : [];
        const oList = Array.isArray(ls.observerList) ? ls.observerList : [];
        if (oHistory.length > 0) observerCount = oHistory.length;
        else if (oList.length > 0) observerCount = oList.length;

        // start/end times from live session when available
        const startTime = ls.startTime ?? null;
        const endTime = ls.endTime ?? null;

        return {
          ...b,
          liveSession: ls,
          participantCount,
          observerCount,
          liveStartTime: startTime,
          liveEndTime: endTime,
        };
      });
    }

    const total = await totalPromise;

    // ── build meta payload ─────────────────────────────────────
    const totalPages = Math.ceil(total / limit);

    const meta = {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    };

    sendResponse(res, sessions, "Sessions fetched", 200, meta);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /sessions/:id
 * Fetch a single session by its ID
 */
export const getSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Lookup
    const session = await SessionModel.findById(id)
      .populate(SESSION_POPULATE)
      .lean();

    if (!session) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 2. Return it
    sendResponse(res, session, "Session fetched", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /sessions/project/:projectId/latest?role=Participant|Observer|Moderator|Admin
 * Resolve the latest session for a project based on role semantics.
 * Priority:
 *  1) If any LiveSession is ongoing for this project's sessions, return that (status: "ongoing").
 *  2) If none ongoing:
 *     - Participant: Option B → 404 "No session is currently running".
 *     - Observer/Moderator/Admin: Option A → return time-window ongoing if any, else nearest upcoming.
 */
export const getLatestSessionForProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const roleRaw = (req.query.role as string) || "";
    const allowedRoles = new Set([
      "Participant",
      "Observer",
      "Moderator",
      "Admin",
    ]);

    // Validate role
    if (!allowedRoles.has(roleRaw)) {
      return next(new ErrorHandler("Invalid or missing role", 400));
    }

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new ErrorHandler("Invalid project id", 400));
    }

    // Ensure project exists
    const project = await ProjectModel.findById(projectId).lean();
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }

    // 1) Prefer an actually ongoing LiveSession for this project's sessions
    const liveWithSession = await LiveSessionModel.find({ ongoing: true })
      .populate({
        path: "sessionId",
        select: "projectId startAtEpoch endAtEpoch",
      })
      .lean();

    const liveForProject = liveWithSession.find((ls: any) => {
      const sess = ls.sessionId as any;
      return sess && String(sess.projectId) === String(projectId);
    });

    if (liveForProject && liveForProject.sessionId) {
      const sess = liveForProject.sessionId as unknown as {
        _id: string | mongoose.Types.ObjectId;
        projectId: string | mongoose.Types.ObjectId;
        startAtEpoch: number;
        endAtEpoch: number;
      };
      const data = {
        sessionId: String(sess._id),
        status: "ongoing" as const,
        startAtEpoch: sess.startAtEpoch,
        endAtEpoch: sess.endAtEpoch,
      };
      sendResponse(res, data, "Resolved latest session (ongoing)", 200);
      return;
    }

    // 2) None ongoing via LiveSession
    const now = Date.now();

    if (roleRaw === "Participant") {
      // Option B: No session for participants when none ongoing
      next(new ErrorHandler("No session is currently running", 404));
    }

    // Option A for Observer/Moderator/Admin
    // 2a) Try time-window ongoing (scheduled window contains now)
    const windowOngoing = await SessionModel.findOne({
      projectId,
      startAtEpoch: { $lte: now },
      endAtEpoch: { $gte: now },
    })
      .sort({ startAtEpoch: -1 })
      .lean();

    if (windowOngoing) {
      const data = {
        sessionId: String(windowOngoing._id),
        status: "ongoing" as const,
        startAtEpoch: windowOngoing.startAtEpoch,
        endAtEpoch: windowOngoing.endAtEpoch,
      };
      sendResponse(res, data, "Resolved latest session (window ongoing)", 200);
      return;
    }

    // 2b) Else nearest upcoming
    const upcoming = await SessionModel.findOne({
      projectId,
      startAtEpoch: { $gt: now },
    })
      .sort({ startAtEpoch: 1 })
      .lean();

    if (upcoming) {
      const data = {
        sessionId: String(upcoming._id),
        status: "upcoming" as const,
        startAtEpoch: upcoming.startAtEpoch,
        endAtEpoch: upcoming.endAtEpoch,
      };
      sendResponse(res, data, "Resolved upcoming session", 200);
      return;
    }

    // 2c) None found
    next(new ErrorHandler("No current or upcoming session", 404));
  } catch (err) {
    next(err);
  }
};

export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Load the original session
    const original = await SessionModel.findById(sessionId);
    if (!original) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 1a. Load project to enforce locked timezone
    const project = await ProjectModel.findById(original.projectId);
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }

    // 2. Build an updates object only with allowed fields
    const allowed = [
      "title",
      "date",
      "startTime",
      "duration",
      "moderators",
    ] as const;

    // 3. Build an updates object only with allowed fields
    const updates: Partial<Record<(typeof allowed)[number], any>> = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // 3a. Explicitly block forbidden fields from this endpoint
    if (req.body.timeZone !== undefined) {
      return next(
        new ErrorHandler(
          "Project timezone is locked and cannot be changed",
          400
        )
      );
    }
    if (req.body.breakoutRoom !== undefined) {
      return next(
        new ErrorHandler("Breakout room cannot be edited from this screen", 400)
      );
    }

    // 4. If nothing to update, reject
    if (Object.keys(updates).length === 0) {
      return next(new ErrorHandler("No valid fields provided for update", 400));
    }

    // 5. If moderators updated, re-validate them
    if (updates.moderators) {
      const modIds = Array.from(new Set(updates.moderators));
      const found = await ModeratorModel.find({ _id: { $in: modIds } });
      if (found.length !== modIds.length) {
        return next(new ErrorHandler("One or more moderators not found", 404));
      }
    }

    // 6. Determine the “new” values to check for conflicts
    const newDate = updates.date ?? original.date;
    const newStartTime = updates.startTime ?? original.startTime;
    const newDuration = updates.duration ?? original.duration;
    // Enforce project-level timezone lock (always use project default)
    const newTzLabel = project.defaultTimeZone as string;
    const newTz = resolveToIana(newTzLabel);
    if (!newTz) {
      return next(
        new ErrorHandler(
          `Project time zone "${newTzLabel}" is not recognized.`,
          400
        )
      );
    }

    // 7. Fetch all other sessions in this project
    const otherSessions = await SessionModel.find({
      projectId: original.projectId,
      _id: { $ne: sessionId },
    });

    // 8. Compute epochs with strict DST policy
    // Normalize dates to YYYY-MM-DD in the project's IANA zone to avoid
    // inconsistencies between stored Date objects (UTC) and the project's zone.
    const normNewDate =
      typeof newDate === "string"
        ? newDate
        : require("luxon")
            .DateTime.fromJSDate(newDate)
            .setZone(newTz)
            .toISODate();

    const startNew = toTimestampStrict(normNewDate, newStartTime, newTz);
    const endNew = startNew + newDuration * 60_000;

    for (const ex of otherSessions) {
      const exIana = resolveToIana(ex.timeZone) ?? newTz;
      const normExDate =
        typeof ex.date === "string"
          ? ex.date
          : require("luxon")
              .DateTime.fromJSDate(ex.date)
              .setZone(exIana)
              .toISODate();
      const startEx = toTimestampStrict(normExDate, ex.startTime, exIana);
      const endEx = startEx + ex.duration * 60_000;
      if (startNew < endEx && startEx < endNew) {
        console.warn(
          `Session conflict on update: proposed [${startNew}-${endNew}] vs existing {title:${ex.title}} [${startEx}-${endEx}] in project ${original.projectId}`
        );
        return next(
          new ErrorHandler(
            `Proposed time conflicts with existing session "${ex.title}"`,
            409
          )
        );
      }
    }

    // 9. No conflicts — perform the update
    const updated = await SessionModel.findByIdAndUpdate(
      sessionId,
      {
        ...updates,
        timeZone: newTz,
        startAtEpoch: startNew,
        endAtEpoch: endNew,
      },
      {
        new: true,
      }
    ).populate(SESSION_POPULATE);

    // 10. If not found, 404
    if (!updated) {
      return next(new ErrorHandler("Session not found during update", 404));
    }

    // 11. Return the updated session
    sendResponse(res, updated, "Session updated", 200);
  } catch (err) {
    next(err);
  }
};

export const duplicateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Find the existing session
    const original = await SessionModel.findById(sessionId);
    if (!original) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 1a. Load project for timezone
    const project = await ProjectModel.findById(original.projectId);
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }

    const {
      _id, // drop
      createdAt, // drop
      updatedAt, // drop
      __v, // (optional) drop version key too
      ...data // data now has only the session fields you care about
    } = original.toObject();

    // 3. Modify the title
    data.title = `${original.title} (copy)`;

    // 3a. Recompute epochs with locked project timezone
    const tz = project.defaultTimeZone;
    const startAtEpoch = toTimestampStrict(data.date, data.startTime, tz);
    const endAtEpoch = startAtEpoch + data.duration * 60_000;
    data.timeZone = tz;
    data.startAtEpoch = startAtEpoch;
    data.endAtEpoch = endAtEpoch;

    // 4. Insert the new document
    const copy = await SessionModel.create(data);

    // 5. Return the duplicated session
    sendResponse(res, copy, "Session duplicated", 201);
  } catch (err) {
    next(err);
  }
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.id;

    // 1. Attempt deletion
    const deleted = await SessionModel.findByIdAndDelete(sessionId);

    // 2. If nothing was deleted, the id was invalid
    if (!deleted) {
      return next(new ErrorHandler("Session not found", 404));
    }

    // 3. Success—return the deleted doc for confirmation
    sendResponse(res, deleted, "Session deleted", 200);
  } catch (err) {
    next(err);
  }
};
