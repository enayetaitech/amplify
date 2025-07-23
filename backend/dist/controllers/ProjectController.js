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
exports.toggleRecordingAccess = exports.editProject = exports.getProjectById = exports.getProjectByUserId = exports.emailProjectInfo = exports.createProjectByExternalAdmin = exports.saveProgress = void 0;
const ResponseHelpers_1 = require("../utils/ResponseHelpers");
const ProjectFormModel_1 = __importDefault(require("../model/ProjectFormModel"));
const UserModel_1 = __importDefault(require("../model/UserModel"));
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const ProjectModel_1 = __importDefault(require("../model/ProjectModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const emailTemplates_1 = require("../constants/emailTemplates");
const SendVerifyAccountEmailProcessor_1 = require("../processors/sendEmail/SendVerifyAccountEmailProcessor");
const ModeratorModel_1 = __importDefault(require("../model/ModeratorModel"));
// ! the fields you really need to keep the payload light
const PROJECT_POPULATE = [
    { path: "moderators", select: "firstName lastName email" },
    { path: "meetings", select: "title date startTime duration timeZone " },
    { path: "createdBy", select: "firstName lastName email" },
    { path: "tags", select: "title color" },
];
const saveProgress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { uniqueId, formData, userId } = req.body;
    if (!userId) {
        (0, ResponseHelpers_1.sendResponse)(res, null, "User ID is required", 400);
    }
    if (!formData || Object.keys(formData).length === 0) {
        (0, ResponseHelpers_1.sendResponse)(res, null, "Form data is required", 400);
    }
    let savedForm;
    if (uniqueId) {
        // Look for an existing form document by its ID
        const existingForm = yield ProjectFormModel_1.default.findById(uniqueId);
        if (!existingForm) {
            // If not found, create a new form entry
            const newForm = new ProjectFormModel_1.default(Object.assign({ user: userId }, formData));
            savedForm = yield newForm.save();
            (0, ResponseHelpers_1.sendResponse)(res, { uniqueId: savedForm._id }, "Form not found. New progress saved successfully.", 201);
        }
        else {
            // If found, update the existing document with the provided form data
            existingForm.set(formData);
            savedForm = yield existingForm.save();
            (0, ResponseHelpers_1.sendResponse)(res, { uniqueId: savedForm._id }, "Progress updated successfully", 200);
        }
    }
    else {
        // Create a new form entry if no uniqueId is provided
        const newForm = new ProjectFormModel_1.default(Object.assign({ user: userId }, formData));
        savedForm = yield newForm.save();
        (0, ResponseHelpers_1.sendResponse)(res, { uniqueId: savedForm._id }, "Progress saved successfully", 201);
    }
});
exports.saveProgress = saveProgress;
const createProjectByExternalAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, uniqueId, projectData, totalPurchasePrice, totalCreditsNeeded, } = req.body;
    if (!userId || !projectData) {
        throw new ErrorHandler_1.default("User ID and project data are required", 400);
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = yield UserModel_1.default.findById(userId).session(session);
        if (!user)
            throw new ErrorHandler_1.default("User not found", 404);
        if (["AmplifyTechHost", "AmplifyModerator"].includes(user.role)) {
            throw new ErrorHandler_1.default("You are not authorized to create a project", 403);
        }
        // Create the project
        // const createdProject = await ProjectModel.create(
        //   [{ ...projectData, createdBy: userId }],
        //   { session }
        // );
        const project = new ProjectModel_1.default(Object.assign(Object.assign({}, projectData), { createdBy: userId }));
        yield project.save({ session });
        // 3️⃣ Add external admin as moderator
        const moderator = new ModeratorModel_1.default({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            companyName: user.companyName,
            roles: ["Admin"], // new roles array
            adminAccess: true, // if you still use this legacy flag
            projectId: project._id,
            isVerified: true,
            isActive: true,
        });
        yield moderator.save({ session });
        // 4️⃣ Push moderator._id into project.moderators
        project.moderators.push(moderator._id);
        yield project.save({ session });
        // Delete draft if uniqueId exists
        if (uniqueId) {
            yield ProjectModel_1.default.findByIdAndDelete(uniqueId).session(session);
        }
        yield session.commitTransaction();
        session.endSession();
        // Populate tags outside the transaction (optional)
        // !This should be uncommented once the tag collection is created
        // const populatedProject = await ProjectModel.findById(createdProject[0]._id).populate("tags");
        // console.log('populated project', populatedProject)
        // ---- Send the confirmation email below ---- //
        // Extract the payment information (with defaults if missing)
        const purchaseAmount = totalPurchasePrice || 0;
        const creditsPurchased = totalCreditsNeeded || 0;
        // Current date as transaction date (formatted as needed)
        const transactionDate = new Date().toLocaleDateString();
        // If your user model stores a credit balance, compute the new balance; otherwise, use creditsPurchased as the balance.
        const newCreditBalance = (user.credits ? user.credits : 0) + creditsPurchased;
        // Prepare the parameters for the confirmation email template
        const emailParams = {
            firstName: user.firstName || "Customer",
            purchaseAmount,
            creditsPurchased,
            transactionDate,
            newCreditBalance,
        };
        // Build the email content using the separate template function
        const emailContent = (0, emailTemplates_1.projectCreateAndPaymentConfirmationEmailTemplate)(emailParams);
        const emailSubject = "Success! Your Project Has Been Created for Amplify’s Virtual Backroom";
        // Send the email using your email processor function
        yield (0, SendVerifyAccountEmailProcessor_1.sendEmail)({
            to: user.email,
            subject: emailSubject,
            html: emailContent,
        });
        (0, ResponseHelpers_1.sendResponse)(res, project, "Project created successfully", 201);
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        next(error);
    }
});
exports.createProjectByExternalAdmin = createProjectByExternalAdmin;
const emailProjectInfo = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, uniqueId, formData } = req.body;
    // Validate presence of required fields
    if (!userId || !uniqueId) {
        return next(new ErrorHandler_1.default("User ID and Unique ID are required", 400));
    }
    // Find user
    const user = yield UserModel_1.default.findById(userId);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Format sessions
    const formattedSessions = (formData.sessions || [])
        .map((session, index) => `<p>Session ${index + 1}: ${session.number} sessions - Duration: ${session.duration}</p>`)
        .join("");
    // Build HTML email template
    const emailContent = (0, emailTemplates_1.projectInfoEmailTemplate)({
        user,
        formData,
        formattedSessions,
    });
    // Send email
    yield (0, SendVerifyAccountEmailProcessor_1.sendEmail)({
        to: "enayetflweb@gmail.com",
        subject: "New Project Information Submission",
        html: emailContent,
    });
    // Delete project form from DB
    yield ProjectFormModel_1.default.findByIdAndDelete(uniqueId);
    res.status(200).json({
        success: true,
        message: "Project information emailed and progress form removed",
    });
});
exports.emailProjectInfo = emailProjectInfo;
const getProjectByUserId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId } = req.params;
    const { search = "", tag = "", page = 1, limit = 10 } = req.query;
    console.log('req.query', req.query);
    if (!userId) {
        return next(new ErrorHandler_1.default("User ID is required", 400));
    }
    // ── pagination params ───────────────────────────────────────
    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.max(Number(limit), 1);
    const skip = (pageNum - 1) * limitNum;
    const searchRegex = new RegExp(search, "i");
    const tagRegex = new RegExp(tag, "i");
    const baseMatch = {
        $match: {
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
        },
    };
    const searchMatch = {
        $match: {
            $or: [
                { name: { $regex: searchRegex } },
                { "moderators.firstName": { $regex: searchRegex } },
                { "moderators.lastName": { $regex: searchRegex } },
                { "moderators.companyName": { $regex: searchRegex } },
            ],
        },
    };
    const tagMatch = {
        $match: Object.assign({}, (tag
            ? { "tags.name": { $regex: tagRegex } }
            : {}))
    };
    const aggregationPipeline = [
        baseMatch,
        {
            $lookup: {
                from: "moderators",
                localField: "_id",
                foreignField: "projectId",
                as: "moderators",
            },
        },
        { $unwind: { path: "$moderators", preserveNullAndEmptyArrays: true } },
        searchMatch,
        {
            $lookup: {
                from: "sessions",
                localField: "meetings",
                foreignField: "_id",
                as: "meetingObjects",
            },
        },
        {
            $lookup: {
                from: "tags",
                localField: "tags",
                foreignField: "_id",
                as: "tags",
            },
        },
        // {
        //   $unwind: {
        //     path: "$tags",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        ...(tag
            ? [{ $match: { "tags.title": { $regex: tagRegex } } }]
            : []),
        {
            $group: {
                _id: "$_id",
                doc: { $first: "$$ROOT" },
            },
        },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { name: 1 } },
        { $skip: skip },
        { $limit: limitNum },
    ];
    const projects = yield ProjectModel_1.default.aggregate(aggregationPipeline);
    // Separate aggregation for count
    const totalAgg = [
        baseMatch,
        {
            $lookup: {
                from: "moderators",
                localField: "_id",
                foreignField: "projectId",
                as: "moderators",
            },
        },
        { $unwind: { path: "$moderators", preserveNullAndEmptyArrays: true } },
        searchMatch,
        {
            $lookup: {
                from: "tags",
                localField: "tags",
                foreignField: "_id",
                as: "tags",
            },
        },
        ...(tag ? [tagMatch] : []),
        {
            $group: {
                _id: "$_id",
            },
        },
        {
            $count: "total",
        },
    ];
    const totalCountAgg = yield ProjectModel_1.default.aggregate(totalAgg);
    const totalCount = ((_a = totalCountAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    const totalPages = Math.ceil(totalCount / limitNum);
    const meta = {
        page: pageNum,
        limit: limitNum,
        totalItems: totalCount,
        totalPages,
        hasPrev: pageNum > 1,
        hasNext: pageNum < totalPages,
    };
    // Send the result back to the frontend using your sendResponse utility
    (0, ResponseHelpers_1.sendResponse)(res, projects, "Projects retrieved successfully", 200, meta);
});
exports.getProjectByUserId = getProjectByUserId;
const getProjectById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    if (!projectId) {
        return next(new ErrorHandler_1.default("Project ID is required", 400));
    }
    // findById + populate all related paths
    const project = yield ProjectModel_1.default.findById(projectId)
        .populate(PROJECT_POPULATE)
        .exec();
    if (!project) {
        return next(new ErrorHandler_1.default("Project not found", 404));
    }
    (0, ResponseHelpers_1.sendResponse)(res, project, "Project retrieved successfully", 200);
});
exports.getProjectById = getProjectById;
const editProject = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Expecting projectId in body along with the fields to be updated.
    const { projectId, internalProjectName, description } = req.body;
    if (!projectId) {
        return next(new ErrorHandler_1.default("Project ID is required", 400));
    }
    // Ensure at least one field to update is provided.
    if (!internalProjectName && !description) {
        return next(new ErrorHandler_1.default("No update data provided", 400));
    }
    // Find the project by its ID.
    const project = yield ProjectModel_1.default.findById(projectId);
    if (!project) {
        return next(new ErrorHandler_1.default("Project not found", 404));
    }
    // Update only the allowed fields if they are provided.
    if (internalProjectName) {
        project.internalProjectName = internalProjectName;
    }
    if (description) {
        project.description = description;
    }
    console.log("req.body", req.body);
    // Save the updated project.
    const updatedProject = yield project.save();
    (0, ResponseHelpers_1.sendResponse)(res, updatedProject, "Project updated successfully", 200);
});
exports.editProject = editProject;
const toggleRecordingAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.body;
    if (!projectId) {
        return next(new ErrorHandler_1.default("Project ID is required", 400));
    }
    // Find the project by its ID
    const project = yield ProjectModel_1.default.findById(projectId);
    if (!project) {
        return next(new ErrorHandler_1.default("Project not found", 404));
    }
    // Toggle the recordingAccess field
    project.recordingAccess = !project.recordingAccess;
    // Save the updated project
    const updatedProject = yield project.save();
    (0, ResponseHelpers_1.sendResponse)(res, updatedProject, "Recording access toggled successfully", 200);
});
exports.toggleRecordingAccess = toggleRecordingAccess;
