
import { createSessions } from "../../controllers/SessionController";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import express from "express";


const router = express.Router();

// POST /api/v1/sessions/
router.post("/", catchError(createSessions));



export default router;