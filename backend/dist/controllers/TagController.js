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
exports.deleteTag = exports.editTag = exports.getTagsByUserId = exports.getTagsByProjectId = exports.createTag = void 0;
const ResponseHelpers_1 = require("../utils/ResponseHelpers");
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const UserModel_1 = __importDefault(require("../model/UserModel"));
const ProjectModel_1 = __importDefault(require("../model/ProjectModel"));
const TagModel_1 = require("../model/TagModel");
const mongoose_1 = __importDefault(require("mongoose"));
const createTag = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, color, createdBy, projectId } = req.body;
        // 1️⃣ basic validation ----------------------------------------------------
        if (!title || !color || !createdBy || !projectId) {
            return next(new ErrorHandler_1.default("title, color, createdBy and projectId are required", 400));
        }
        // 2️⃣ existence checks ----------------------------------------------------
        const [project, user] = yield Promise.all([
            ProjectModel_1.default.findById(projectId),
            UserModel_1.default.findById(createdBy),
        ]);
        if (!project)
            return next(new ErrorHandler_1.default("Project not found", 404));
        if (!user)
            return next(new ErrorHandler_1.default("User not found", 404));
        // 3️⃣ optional duplicate-title guard (case-insensitive) -------------------
        const clash = yield TagModel_1.TagModel.findOne({
            projectId,
            title: { $regex: new RegExp(`^${title}$`, "i") },
        });
        if (clash) {
            return next(new ErrorHandler_1.default("A tag with this title already exists for this project", 409));
        }
        // ─── START TRANSACTION ───────────────────────────────────────────────
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        let tagDoc;
        try {
            // 4️⃣ Create & save tag under txn
            tagDoc = new TagModel_1.TagModel({ title, color, createdBy, projectId });
            yield tagDoc.save({ session });
            // 5️⃣ Push its ObjectId into project.tags & save
            project.tags.push(tagDoc._id);
            yield project.save({ session });
            // 6️⃣ Commit both writes
            yield session.commitTransaction();
        }
        catch (err) {
            // 7️⃣ Roll back everything on error
            yield session.abortTransaction();
            session.endSession();
            return next(err);
        }
        finally {
            session.endSession();
        }
        // ─── TRANSACTION END ─────────────────────────────────────────────
        // 8️⃣ Convert to your shared ITag shape (if needed)
        const responsePayload = Object.assign(Object.assign({}, tagDoc.toObject()), { _id: tagDoc._id.toString(), createdBy: tagDoc.createdBy.toString(), projectId: tagDoc.projectId.toString(), createdAt: tagDoc.createdAt, updatedAt: tagDoc.updatedAt });
        (0, ResponseHelpers_1.sendResponse)(res, responsePayload, "Tag created", 201);
    }
    catch (err) {
        next(err);
    }
});
exports.createTag = createTag;
const getTagsByProjectId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const projectExists = yield ProjectModel_1.default.exists({ _id: projectId });
        if (!projectExists)
            return next(new ErrorHandler_1.default("Project not found", 404));
        const tags = yield TagModel_1.TagModel.find({ projectId }).sort({ title: 1 }).lean();
        (0, ResponseHelpers_1.sendResponse)(res, tags, "Tags fetched", 200);
    }
    catch (err) {
        next(err);
    }
});
exports.getTagsByProjectId = getTagsByProjectId;
const getTagsByUserId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const userExists = yield UserModel_1.default.exists({ _id: userId });
        if (!userExists)
            return next(new ErrorHandler_1.default("User not found", 404));
        const tags = yield TagModel_1.TagModel.find({ createdBy: userId })
            .sort({
            title: 1,
        })
            .lean();
        (0, ResponseHelpers_1.sendResponse)(res, tags, "Tags fetched", 200);
    }
    catch (err) {
        next(err);
    }
});
exports.getTagsByUserId = getTagsByUserId;
const editTag = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, color } = req.body;
        if (!title && !color) {
            return next(new ErrorHandler_1.default("No update data provided", 400));
        }
        const tag = yield TagModel_1.TagModel.findById(id);
        if (!tag)
            return next(new ErrorHandler_1.default("Tag not found", 404));
        // Optional duplicate title guard (same project)
        if (title && title !== tag.title) {
            const duplicate = yield TagModel_1.TagModel.findOne({
                projectId: tag.projectId,
                title: { $regex: new RegExp(`^${title}$`, "i") },
            });
            if (duplicate) {
                return next(new ErrorHandler_1.default("Another tag with this title already exists in the project", 409));
            }
            tag.title = title;
        }
        if (color)
            tag.color = color;
        const updated = yield tag.save();
        (0, ResponseHelpers_1.sendResponse)(res, updated, "Tag updated", 200);
    }
    catch (err) {
        next(err);
    }
});
exports.editTag = editTag;
const deleteTag = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield TagModel_1.TagModel.findByIdAndDelete(id);
        if (!deleted)
            return next(new ErrorHandler_1.default("Tag not found", 404));
        yield ProjectModel_1.default.updateMany({ tags: id }, { $pull: { tags: id } });
        (0, ResponseHelpers_1.sendResponse)(res, deleted, "Tag deleted", 200);
    }
    catch (err) {
        next(err);
    }
});
exports.deleteTag = deleteTag;
