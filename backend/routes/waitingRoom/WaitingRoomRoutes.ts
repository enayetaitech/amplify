import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { enqueue } from "../../controllers/WaitingRoomController";

const router = express.Router();

// POST /api/v1/waiting-room/enqueue
router.post("/enqueue", catchError(enqueue));

export default router;
