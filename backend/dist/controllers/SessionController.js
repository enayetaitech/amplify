"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.duplicateSession = exports.updateSession = exports.getSessionById = exports.getSessionsByProject = exports.createSessions = void 0;
const ResponseHelpers_1 = require("../utils/ResponseHelpers");
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const SessionModel_1 = require("../model/SessionModel");
const ProjectModel_1 = __importDefault(require("../model/ProjectModel"));
const ModeratorModel_1 = __importDefault(require("../model/ModeratorModel"));
const sessionTimeConflictChecker_1 = require("../processors/session/sessionTimeConflictChecker");
const luxon_1 = require("luxon");
const sessionService = __importStar(require("../processors/liveSession/sessionService"));
const mongoose_1 = __importDefault(require("mongoose"));
// !  the fields you really need to keep the payload light
const SESSION_POPULATE = [
    { path: "moderators", select: "firstName lastName email" },
    { path: "projectId", select: "service" },
];
const createSessions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, timeZone, breakoutRoom, sessions } = req.body;
    // 1. Basic payload validation
    if (!Array.isArray(sessions) ||
        sessions.length === 0 ||
        !projectId ||
        typeof timeZone !== "string" ||
        breakoutRoom === undefined) {
        return next(new ErrorHandler_1.default("Sessions array, project id, time zone, breakout room information are required", 400));
    }
    console.log('req.body', req.body);
    console.log("req.body.sessions =", JSON.stringify(req.body.sessions, null, 2));
    // 2. Project existence check
    const project = yield ProjectModel_1.default.findById(projectId);
    if (!project) {
        return next(new ErrorHandler_1.default("Project not found", 404));
    }
    // 3. Moderator existence check
    const modIds = Array.from(new Set(sessions.flatMap((s) => s.moderators)));
    const allMods = yield ModeratorModel_1.default.find({
        _id: { $in: modIds },
    });
    if (allMods.length !== modIds.length) {
        return next(new ErrorHandler_1.default("One or more moderators not found", 404));
    }
    // 4. Pull all existing sessions for this project
    const existing = yield SessionModel_1.SessionModel.find({ projectId });
    // 5. Validate no overlaps
    for (const s of sessions) {
        const tz = timeZone;
        const startNew = (0, sessionTimeConflictChecker_1.toTimestamp)(s.date, s.startTime, tz);
        const endNew = startNew + s.duration * 60000;
        // calendar day in this timeZone
        const dayNew = luxon_1.DateTime.fromISO(typeof s.date === "string"
            ? s.date
            : luxon_1.DateTime.fromJSDate(s.date).toISODate(), { zone: tz }).toISODate();
        for (const ex of existing) {
            const exTz = ex.timeZone;
            const dayEx = luxon_1.DateTime.fromISO(luxon_1.DateTime.fromJSDate(ex.date).toISODate(), { zone: exTz }).toISODate();
            if (dayEx !== dayNew)
                continue;
            const startEx = (0, sessionTimeConflictChecker_1.toTimestamp)(ex.date, ex.startTime, exTz);
            const endEx = startEx + ex.duration * 60000;
            // overlap if: startNew < endEx && startEx < endNew
            if (startNew < endEx && startEx < endNew) {
                return next(new ErrorHandler_1.default(`Session "${s.title}" conflicts with existing "${ex.title}"`, 409));
            }
        }
    }
    // 6. Map each session, injecting the shared fields
    const docs = sessions.map((s) => ({
        projectId,
        timeZone,
        breakoutRoom,
        title: s.title,
        date: s.date,
        startTime: s.startTime,
        duration: s.duration,
        moderators: s.moderators,
    }));
    // 7. Bulk insert into MongoDB
    // ─── START TRANSACTION ────────────────────────────────────────────
    const mongoSession = yield mongoose_1.default.startSession();
    mongoSession.startTransaction();
    let created;
    try {
        created = yield SessionModel_1.SessionModel.insertMany(docs, { session: mongoSession });
        for (const sess of created) {
            yield sessionService.createLiveSession(sess._id.toString(), {
                session: mongoSession,
            });
        }
        project.meetings.push(...created.map((s) => s._id));
        yield project.save({ session: mongoSession });
        yield mongoSession.commitTransaction();
    }
    catch (err) {
        yield mongoSession.abortTransaction();
        mongoSession.endSession();
        return next(err);
    }
    finally {
        // always end the session
        mongoSession.endSession();
    }
    // 8. Send uniform success response
    (0, ResponseHelpers_1.sendResponse)(res, created, "Sessions created", 201);
});
exports.createSessions = createSessions;
/**
 * GET /sessions/project/:projectId
 * Fetch all sessions for a given project
 */
const getSessionsByProject = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        // ── pagination params ───────────────────────────────────────
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        // ── parallel queries: data + count ─────────────────────────
        const [sessions, total] = yield Promise.all([
            SessionModel_1.SessionModel.find({ projectId })
                .sort({ date: 1, startTime: 1 })
                .skip(skip)
                .limit(limit)
                .populate(SESSION_POPULATE)
                .lean(),
            SessionModel_1.SessionModel.countDocuments({ projectId }),
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
        (0, ResponseHelpers_1.sendResponse)(res, sessions, "Sessions fetched", 200, meta);
    }
    catch (err) {
        next(err);
    }
});
exports.getSessionsByProject = getSessionsByProject;
/**
 * GET /sessions/:id
 * Fetch a single session by its ID
 */
const getSessionById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // 1. Lookup
        const session = yield SessionModel_1.SessionModel.findById(id)
            .populate(SESSION_POPULATE)
            .lean();
        if (!session) {
            return next(new ErrorHandler_1.default("Session not found", 404));
        }
        // 2. Return it
        (0, ResponseHelpers_1.sendResponse)(res, session, "Session fetched", 200);
    }
    catch (err) {
        next(err);
    }
});
exports.getSessionById = getSessionById;
const updateSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const sessionId = req.params.id;
        // 1. Load the original session
        const original = yield SessionModel_1.SessionModel.findById(sessionId);
        if (!original) {
            return next(new ErrorHandler_1.default("Session not found", 404));
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
        ];
        // 3. Build an updates object only with allowed fields
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
        // 4. If nothing to update, reject
        if (Object.keys(updates).length === 0) {
            return next(new ErrorHandler_1.default("No valid fields provided for update", 400));
        }
        // 5. If moderators updated, re-validate them
        if (updates.moderators) {
            const modIds = Array.from(new Set(updates.moderators));
            const found = yield ModeratorModel_1.default.find({ _id: { $in: modIds } });
            if (found.length !== modIds.length) {
                return next(new ErrorHandler_1.default("One or more moderators not found", 404));
            }
        }
        // 6. Determine the “new” values to check for conflicts
        const newDate = (_a = updates.date) !== null && _a !== void 0 ? _a : original.date;
        const newStartTime = (_b = updates.startTime) !== null && _b !== void 0 ? _b : original.startTime;
        const newDuration = (_c = updates.duration) !== null && _c !== void 0 ? _c : original.duration;
        const newTz = (_d = updates.timeZone) !== null && _d !== void 0 ? _d : original.timeZone;
        // 7. Fetch all other sessions in this project
        const otherSessions = yield SessionModel_1.SessionModel.find({
            projectId: original.projectId,
            _id: { $ne: sessionId },
        });
        // 8. Check each “other” session for an overlap with our proposed slot
        const startNew = (0, sessionTimeConflictChecker_1.toTimestamp)(newDate, newStartTime, newTz);
        const endNew = startNew + newDuration * 60000;
        const dayNew = luxon_1.DateTime.fromISO(typeof newDate === "string"
            ? newDate
            : luxon_1.DateTime.fromJSDate(newDate).toISODate(), { zone: newTz }).toISODate();
        for (const ex of otherSessions) {
            const exTz = ex.timeZone;
            const dayEx = luxon_1.DateTime.fromISO(luxon_1.DateTime.fromJSDate(ex.date).toISODate(), { zone: exTz }).toISODate();
            if (dayEx !== dayNew)
                continue;
            const startEx = (0, sessionTimeConflictChecker_1.toTimestamp)(ex.date, ex.startTime, exTz);
            const endEx = startEx + ex.duration * 60000;
            // overlap test:
            if (startNew < endEx && startEx < endNew) {
                return next(new ErrorHandler_1.default(`Proposed time conflicts with existing session "${ex.title}"`, 409));
            }
        }
        // 9. No conflicts — perform the update
        const updated = yield SessionModel_1.SessionModel.findByIdAndUpdate(sessionId, updates, {
            new: true,
        });
        // 10. If not found, 404
        if (!updated) {
            return next(new ErrorHandler_1.default("Session not found during update", 404));
        }
        // 11. Return the updated session
        (0, ResponseHelpers_1.sendResponse)(res, updated, "Session updated", 200);
    }
    catch (err) {
        next(err);
    }
});
exports.updateSession = updateSession;
const duplicateSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.id;
        // 1. Find the existing session
        const original = yield SessionModel_1.SessionModel.findById(sessionId);
        if (!original) {
            return next(new ErrorHandler_1.default("Session not found", 404));
        }
        const _a = original.toObject(), { _id, // drop
        createdAt, // drop
        updatedAt, // drop
        __v } = _a, // (optional) drop version key too
        data = __rest(_a, ["_id", "createdAt", "updatedAt", "__v"]) // data now has only the session fields you care about
        ;
        // 3. Modify the title
        data.title = `${original.title} (copy)`;
        // 4. Insert the new document
        const copy = yield SessionModel_1.SessionModel.create(data);
        // 5. Return the duplicated session
        (0, ResponseHelpers_1.sendResponse)(res, copy, "Session duplicated", 201);
    }
    catch (err) {
        next(err);
    }
});
exports.duplicateSession = duplicateSession;
const deleteSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.id;
        // 1. Attempt deletion
        const deleted = yield SessionModel_1.SessionModel.findByIdAndDelete(sessionId);
        // 2. If nothing was deleted, the id was invalid
        if (!deleted) {
            return next(new ErrorHandler_1.default("Session not found", 404));
        }
        // 3. Success—return the deleted doc for confirmation
        (0, ResponseHelpers_1.sendResponse)(res, deleted, "Session deleted", 200);
    }
    catch (err) {
        next(err);
    }
});
exports.deleteSession = deleteSession;
