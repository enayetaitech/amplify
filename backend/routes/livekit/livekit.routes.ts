// src/routes/livekit/LivekitRoutes.ts
import express from "express";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import {
  exchangeAdmitForLivekitToken,
  getLivekitToken,
} from "../../controllers/LivekitController";
import { getObserverHls } from "../../controllers/LiveReadController";
import {
  createBreakoutRoom,
  listBreakouts,
  listBreakoutsPublic,
  closeBreakout,
  extendBreakout,
  moveParticipantToBreakout,
  moveParticipantToMain,
  listParticipantsOfRoom,
} from "../../controllers/BreakoutController";

const router = express.Router();

// POST /api/v1/livekit/token
router.post("/token", authenticateJwt, catchError(getLivekitToken));

// POST /api/v1/livekit/exchange
router.post("/exchange", catchError(exchangeAdmitForLivekitToken));

// POST /api/v1/livekit/:sessionId/hls
router.get("/:sessionId/hls", catchError(getObserverHls));

// ===== Breakouts =====
router.post(
  "/:sessionId/breakouts",
  authenticateJwt,
  authorizeRoles("Admin", "Moderator"),
  catchError(createBreakoutRoom)
);
router.get(
  "/:sessionId/breakouts",
  authenticateJwt,
  authorizeRoles("Admin", "Moderator"),
  catchError(listBreakouts)
);

// Public read-only list for observers (no auth)
router.get("/public/:sessionId/breakouts", catchError(listBreakoutsPublic));
router.post(
  "/:sessionId/breakouts/:index/close",
  authenticateJwt,
  authorizeRoles("Admin", "Moderator"),
  catchError(closeBreakout)
);
router.post(
  "/:sessionId/breakouts/:index/extend",
  authenticateJwt,
  authorizeRoles("Admin", "Moderator"),
  catchError(extendBreakout)
);
router.post(
  "/:sessionId/breakouts/move-to",
  authenticateJwt,
  authorizeRoles("Admin", "Moderator"),
  catchError(moveParticipantToBreakout)
);
router.post(
  "/:sessionId/breakouts/move-back",
  authenticateJwt,
  authorizeRoles("Admin", "Moderator"),
  catchError(moveParticipantToMain)
);
router.get(
  "/:sessionId/participants",
  authenticateJwt,
  authorizeRoles("Admin", "Moderator"),
  catchError(listParticipantsOfRoom)
);

export default router;
