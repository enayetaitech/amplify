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

  // 4. Pull all existing sessions for this project
  const existing = await SessionModel.find({ projectId });

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

  // Intra-batch overlap check
  for (let i = 0; i < newSessions.length; i++) {
    for (let j = i + 1; j < newSessions.length; j++) {
      const a = newSessions[i];
      const b = newSessions[j];
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

  // Check against existing sessions (by epoch)
  for (const s of newSessions) {
    for (const ex of existing) {
      const exIana = resolveToIana(ex.timeZone) ?? ianaTimeZone;
      const startEx = toTimestampStrict(ex.date, ex.startTime, exIana);
      const endEx = startEx + ex.duration * 60_000;
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

    for (const sess of created) {
      await sessionService.createLiveSession(sess._id.toString(), {
        session: mongoSession,
      });
    }

    project.meetings.push(...created.map((s) => s._id));
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

    // ── parallel queries: data + count ─────────────────────────
    const [sessions, total] = await Promise.all([
      SessionModel.find({ projectId })
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate(SESSION_POPULATE)
        .lean(),
      SessionModel.countDocuments({ projectId }),
    ]);

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
      "timeZone",
      "breakoutRoom",
    ] as const;

    // 3. Build an updates object only with allowed fields
    const updates: Partial<Record<(typeof allowed)[number], any>> = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
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
    // Enforce project-level timezone lock
    if (
      updates.timeZone !== undefined &&
      updates.timeZone !== project.defaultTimeZone
    ) {
      return next(
        new ErrorHandler(
          "Project timezone is locked and cannot be changed",
          400
        )
      );
    }
    const newTz = project.defaultTimeZone;

    // 7. Fetch all other sessions in this project
    const otherSessions = await SessionModel.find({
      projectId: original.projectId,
      _id: { $ne: sessionId },
    });

    // 8. Compute epochs with strict DST policy
    const startNew = toTimestampStrict(newDate, newStartTime, newTz);
    const endNew = startNew + newDuration * 60_000;

    for (const ex of otherSessions) {
      const startEx = toTimestampStrict(ex.date, ex.startTime, ex.timeZone);
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
    );

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
