import express from "express";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { endLiveSession,  startLiveSession } from "../../controllers/LiveSessionController";

const router = express.Router();

// only moderators can start or end
// POST api/v1/liveSessions/:sessionId/start
router.post(
  "/:sessionId/start",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(startLiveSession)
);

// POST api/v1/liveSessions/:sessionId/end
router.post(
  "/:sessionId/end",
  authenticateJwt,
  // authorizeRoles("Moderator"),
  catchError(endLiveSession)
);


export default router;
