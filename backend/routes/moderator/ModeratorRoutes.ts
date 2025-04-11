import { addModerator } from "../../controllers/ModeratorController";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import express from "express";


const router = express.Router();

// POST /api/v1/moderators/add-moderator
router.post("/add-moderator", catchError(addModerator));

export default router;