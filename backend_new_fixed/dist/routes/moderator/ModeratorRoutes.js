"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ModeratorController_1 = require("../../controllers/ModeratorController");
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// POST /api/v1/moderators/add-moderator
router.post("/add-moderator", (0, CatchErrorMiddleware_1.catchError)(ModeratorController_1.addModerator));
// PUT /api/v1/moderators/:moderatorId
router.put("/:moderatorId", (0, CatchErrorMiddleware_1.catchError)(ModeratorController_1.editModerator));
// POST /api/v1/moderators/project/:projectId
router.get("/project/:projectId", (0, CatchErrorMiddleware_1.catchError)(ModeratorController_1.getModeratorsByProjectId));
// POST /api/v1/moderators/:moderatorId
router.get("/:moderatorId", (0, CatchErrorMiddleware_1.catchError)(ModeratorController_1.getModeratorById));
// POST /api/v1/moderators/toggle/:moderatorId
router.patch("/toggle/:moderatorId", (0, CatchErrorMiddleware_1.catchError)(ModeratorController_1.toggleModeratorStatus));
exports.default = router;
