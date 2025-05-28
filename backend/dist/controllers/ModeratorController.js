"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModeratorsByProjectId = exports.toggleModeratorStatus = exports.getModeratorById = exports.editModerator = exports.addModerator = void 0;
const ModeratorModel_1 = __importDefault(require("../model/ModeratorModel"));
const responseHelpers_1 = require("../utils/responseHelpers");
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const ProjectModel_1 = __importDefault(require("../model/ProjectModel"));
const UserModel_1 = __importDefault(require("../model/UserModel"));
const config_1 = __importDefault(require("../config"));
const sendVerifyAccountEmailProcessor_1 = require("../processors/sendEmail/sendVerifyAccountEmailProcessor");
const emailTemplates_1 = require("../constants/emailTemplates");
const mongoose_1 = __importDefault(require("mongoose"));
const ALLOWED_ROLES = ["Admin", "Moderator", "Observer"];
/**
 * Controller to add a new moderator to a project.
 * - Validates input
 * - Prevents duplicate moderators on the same project
 * - Verifies project existence
 * - Looks up the project owner’s name
 * - Saves the new moderator
 * - Sends a “you’ve been added” email
 * - Returns a standardized success response
 */
const addModerator = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, companyName, adminAccess, roles, projectId } = req.body;
    console.log('req.body', req.body);
    // 1️⃣ Validate required fields
    if (!firstName || !lastName || !email || !companyName || !projectId ||
        !Array.isArray(roles)) {
        return next(new ErrorHandler_1.default("firstName, lastName, email, companyName, roles[] and projectId are required", 400));
    }
    // 1a️⃣ Validate roles values
    for (const r of roles) {
        if (!ALLOWED_ROLES.includes(r)) {
            return next(new ErrorHandler_1.default(`Invalid role "${r}". Must be one of: ${ALLOWED_ROLES.join(", ")}`, 400));
        }
    }
    // 2️⃣ Prevent adding the same email twice to a single project
    const alreadyModerator = yield ModeratorModel_1.default.findOne({ email, projectId });
    if (alreadyModerator) {
        return next(new ErrorHandler_1.default("A moderator with the same email is already assigned to this project", 409));
    }
    // 3️⃣ Fetch the target project by ID
    const project = yield ProjectModel_1.default.findById(projectId);
    if (!project) {
        return next(new ErrorHandler_1.default("Project not found", 404));
    }
    // 4️⃣ Lookup the project owner (creator) to get their full name
    const creator = yield UserModel_1.default.findById(project.createdBy);
    if (!creator) {
        return next(new ErrorHandler_1.default("Project owner not found", 500));
    }
    // console.log(req.body, project, creator)
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    let moderator;
    // console.log('let moderator', moderator)
    try {
        // 5️⃣ Create and save the new moderator document
        moderator = new ModeratorModel_1.default({
            firstName,
            lastName,
            email,
            companyName,
            roles,
            adminAccess: !!adminAccess,
            projectId,
        });
        // 2️⃣ Save it, passing the session as part of save-options
        yield moderator.save({ session });
        // 2️⃣ push into project's moderators array in the same session
        project.moderators.push(moderator._id);
        yield project.save({ session });
        // 3️⃣ commit the transaction
        yield session.commitTransaction();
    }
    catch (err) {
        console.log('error', err);
        yield session.abortTransaction();
        throw (err);
    }
    finally {
        session.endSession();
    }
    const addedByName = `${creator.firstName} ${creator.lastName}`;
    // 6️⃣ Build and send the notification email
    const emailHtml = (0, emailTemplates_1.moderatorAddedEmailTemplate)({
        moderatorName: firstName,
        addedByName,
        projectName: project.name,
        loginUrl: `${config_1.default.frontend_base_url}/login`,
    });
    yield (0, sendVerifyAccountEmailProcessor_1.sendEmail)({
        to: email,
        subject: `You’ve been added to "${project.name}"`,
        html: emailHtml,
    });
    // 7️⃣ Respond to the API client with the newly created moderator
    (0, responseHelpers_1.sendResponse)(res, moderator, "Moderator added successfully", 201);
});
exports.addModerator = addModerator;
/**
 * Edit a moderator’s details.
 * - If the moderator.isVerified === true, only adminAccess can be updated.
 * - Otherwise, firstName, lastName, email, companyName, and adminAccess are all editable.
 */
const editModerator = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { moderatorId } = req.params;
    const { firstName, lastName, email, companyName, adminAccess } = req.body;
    // 1️⃣ Find the moderator
    const moderator = yield ModeratorModel_1.default.findById(moderatorId);
    if (!moderator) {
        return next(new ErrorHandler_1.default("Moderator not found", 404));
    }
    // 2️⃣ Determine which fields may be updated
    if (moderator.isVerified) {
        // Once verified, only adminAccess can change
        if (typeof adminAccess === "boolean") {
            moderator.adminAccess = adminAccess;
        }
        else {
            return next(new ErrorHandler_1.default("Moderator is verified: only adminAccess may be updated", 400));
        }
    }
    else {
        // Not yet verified: allow personal fields + adminAccess
        if (firstName !== undefined)
            moderator.firstName = firstName;
        if (lastName !== undefined)
            moderator.lastName = lastName;
        if (email !== undefined)
            moderator.email = email;
        if (companyName !== undefined)
            moderator.companyName = companyName;
        if (typeof adminAccess === "boolean")
            moderator.adminAccess = adminAccess;
    }
    // 3️⃣ Save and respond
    yield moderator.save();
    (0, responseHelpers_1.sendResponse)(res, moderator, "Moderator updated successfully", 200);
});
exports.editModerator = editModerator;
/**
 * Get a single moderator by ID.
 */
const getModeratorById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { moderatorId } = req.params;
    const moderator = yield ModeratorModel_1.default.findById(moderatorId);
    if (!moderator) {
        return next(new ErrorHandler_1.default("Moderator not found", 404));
    }
    (0, responseHelpers_1.sendResponse)(res, moderator, "Moderator retrieved successfully", 200);
});
exports.getModeratorById = getModeratorById;
/**
 * Toggle a moderator’s active status.
 * - If currently active, deactivates them.
 * - If currently inactive, reactivates them.
 */
const toggleModeratorStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { moderatorId } = req.params;
    // 1️⃣ Find the moderator
    const moderator = yield ModeratorModel_1.default.findById(moderatorId);
    if (!moderator) {
        return next(new ErrorHandler_1.default("Moderator not found", 404));
    }
    // 2️⃣ Flip the flag
    moderator.isActive = !moderator.isActive;
    // 3️⃣ Save and respond
    yield moderator.save();
    const status = moderator.isActive ? "re-activated" : "deactivated";
    (0, responseHelpers_1.sendResponse)(res, moderator, `Moderator ${status} successfully`, 200);
});
exports.toggleModeratorStatus = toggleModeratorStatus;
/**
 * Get all moderators for a given project.
 */
const getModeratorsByProjectId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    /* ── pagination params ────────────────────────────── */
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    /* ── parallel queries: data + count ───────────────── */
    const [moderators, total] = yield Promise.all([
        ModeratorModel_1.default.find({ projectId })
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ModeratorModel_1.default.countDocuments({ projectId }),
    ]);
    /* ── meta payload ─────────────────────────────────── */
    const totalPages = Math.ceil(total / limit);
    const meta = {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
    };
    (0, responseHelpers_1.sendResponse)(res, moderators, "Moderators for project retrieved", 200, meta);
});
exports.getModeratorsByProjectId = getModeratorsByProjectId;
