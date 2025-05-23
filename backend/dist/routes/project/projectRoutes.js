"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const ProjectController_1 = require("../../controllers/ProjectController");
const authenticateJwt_1 = require("../../middlewares/authenticateJwt");
const authorizeRoles_1 = require("../../middlewares/authorizeRoles");
const router = express_1.default.Router();
// POST /api/v1/projects/save-progress - Register a new user
router.post("/save-progress", (0, CatchErrorMiddleware_1.catchError)(ProjectController_1.saveProgress));
// POST /api/v1/projects/create-project-by-external-admin
router.post("/create-project-by-external-admin", (0, CatchErrorMiddleware_1.catchError)(ProjectController_1.createProjectByExternalAdmin));
// POST /api/v1/projects/email-project-info
router.post("/email-project-info", (0, CatchErrorMiddleware_1.catchError)(ProjectController_1.emailProjectInfo));
// POST /api/v1/projects/get-project-by-userId/:userId
router.get("/get-project-by-userId/:userId", authenticateJwt_1.authenticateJwt, (0, authorizeRoles_1.authorizeRoles)("SuperAdmin", "AmplifyAdmin", "Admin"), (0, CatchErrorMiddleware_1.catchError)(ProjectController_1.getProjectByUserId));
// GET /api/v1/projects/get-project-by-id/:projectId 
router.get("/get-project-by-id/:projectId", authenticateJwt_1.authenticateJwt, (0, authorizeRoles_1.authorizeRoles)("SuperAdmin", "AmplifyAdmin", "Admin"), (0, CatchErrorMiddleware_1.catchError)(ProjectController_1.getProjectById));
// PATCH /api/v1/projects/edit-project 
router.patch("/edit-project", (0, CatchErrorMiddleware_1.catchError)(ProjectController_1.editProject));
// GET /api/v1/projects/toggle-recording-access
router.patch("/toggle-recording-access", (0, CatchErrorMiddleware_1.catchError)(ProjectController_1.toggleRecordingAccess));
exports.default = router;
