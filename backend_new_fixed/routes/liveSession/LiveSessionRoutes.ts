import express from "express";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { endSession, getSessionHistory, startSession } from "../../controllers/LiveSessionController";

const router = express.Router();

// only moderators can start or end
// POST api/v1/liveSessions/:sessionId/start
router.post(
  "/:sessionId/start",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(startSession)
);

// POST api/v1/liveSessions/:sessionId/end
router.post(
  "/:sessionId/end",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(endSession)
);

// GET api/v1/liveSessions/:sessionId/history
router.get(
  "/:sessionId/history",
  authenticateJwt,
  catchError(getSessionHistory)
);

export default router;
