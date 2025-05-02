import { addModerator,  editModerator, getModeratorById, getModeratorsByProjectId, toggleModeratorStatus } from "../../controllers/ModeratorController";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import express from "express";


const router = express.Router();

// POST /api/v1/moderators/add-moderator
router.post("/add-moderator", catchError(addModerator));

// POST /api/v1/moderators/:moderatorId
router.put("/:moderatorId", catchError(editModerator));

// POST /api/v1/moderators/project/:projectId
router.get("/project/:projectId", catchError(getModeratorsByProjectId));

// POST /api/v1/moderators/:moderatorId
router.get("/:moderatorId", catchError(getModeratorById));

// POST /api/v1/moderators/toggle/:moderatorId
router.patch("/toggle/:moderatorId", catchError(toggleModeratorStatus));

export default router;