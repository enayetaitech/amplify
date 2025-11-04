import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import multer from "multer";
import {
  createDeliverable,
  deleteDeliverable,
  downloadDeliverable,
  previewDeliverable,
  viewTextContent,
  downloadMultipleDeliverable,
  getDeliverablesByProjectId,
  renameDeliverable,
  restoreDeliverable,
} from "../../controllers/SessionDeliverableController";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST   /api/v1/sessionDeliverables
router.post(
  "/",
  authenticateJwt,
  upload.single("file"),
  catchError(createDeliverable)
);

// GET    /api/v1/sessionDeliverables/project/:projectId?page=&limit=&type=
router.get("/project/:projectId", catchError(getDeliverablesByProjectId));

// GET    /api/v1/sessionDeliverables/:id/download
router.get("/:id/download", catchError(downloadDeliverable));

// GET    /api/v1/sessionDeliverables/:id/preview
router.get("/:id/preview", catchError(previewDeliverable));

// GET    /api/v1/sessionDeliverables/:id/view
router.get("/:id/view", catchError(viewTextContent));

// POST   /api/v1/sessionDeliverables/download
router.post(
  "/download-bulk",
  authenticateJwt,
  catchError(downloadMultipleDeliverable)
);

// DELETE /api/v1/sessionDeliverables/:id
router.delete(
  "/:id",
  authenticateJwt,
  authorizeRoles("Admin"),
  catchError(deleteDeliverable)
);

// PATCH   /api/v1/sessionDeliverables/:id/rename
router.patch(
  "/:id/rename",
  authenticateJwt,
  authorizeRoles("Admin"),
  catchError(renameDeliverable)
);

// POST    /api/v1/sessionDeliverables/:id/restore
router.post(
  "/:id/restore",
  authenticateJwt,
  authorizeRoles("Admin"),
  catchError(restoreDeliverable)
);

export default router;
