import express from "express";
import {
  getProjectSummaryHandler,
  getProjectSessionsHandler,
} from "../../controllers/reports/ReportsController";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";

const router = express.Router();

// Project summary - only Admin and SuperAdmin can access (further checks in controller)
router.get(
  "/project/:projectId/summary",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  getProjectSummaryHandler
);

// Sessions list with pagination and search
router.get(
  "/project/:projectId/sessions",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  getProjectSessionsHandler
);

router.get(
  "/project/:projectId/participants",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  require("../../controllers/reports/ReportsController")
    .getProjectParticipantsHandler
);

router.get(
  "/project/:projectId/observers",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  require("../../controllers/reports/ReportsController")
    .getProjectObserversHandler
);

router.get(
  "/session/:sessionId/participants",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  require("../../controllers/reports/ReportsController")
    .getSessionParticipantsHandler
);

router.get(
  "/session/:sessionId/observers",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  require("../../controllers/reports/ReportsController")
    .getSessionObserversHandler
);

router.get(
  "/observer/:observerId/summary",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  require("../../controllers/reports/ReportsController")
    .getObserverSummaryHandler
);

export default router;
