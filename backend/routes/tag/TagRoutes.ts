import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import {
  createTag,
  getTagsByProjectId,
  getTagsByUserId,
  editTag,
  deleteTag,
} from "../../controllers/TagController";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";

const router = express.Router();

// POST /api/v1/tags
router.post(
  "/",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  catchError(createTag)
);

// GET    /api/v1/tags/project/:projectId
router.get(
  "/project/:projectId",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  catchError(getTagsByProjectId)
);

// GET    /api/v1/tags/user/:userId
router.get(
  "/user/:userId",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  catchError(getTagsByUserId)
);

// PATCH  /api/v1/tags/:id
router.patch(
  "/:id",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  catchError(editTag)
);

// DELETE /api/v1/tags/:id
router.delete(
  "/:id",
  authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"),
  catchError(deleteTag)
);

export default router;
