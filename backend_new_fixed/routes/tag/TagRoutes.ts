import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { createTag, getTagsByProjectId,getTagsByUserId, editTag, deleteTag} from "../../controllers/TagController";

const router = express.Router();

// POST /api/v1/tags
router.post("/", catchError(createTag));

// GET    /api/v1/tags/project/:projectId
router.get("/project/:projectId", catchError(getTagsByProjectId));

// GET    /api/v1/tags/user/:userId
router.get("/user/:userId", catchError(getTagsByUserId));

// PATCH  /api/v1/tags/:id
router.patch("/:id", catchError(editTag));

// DELETE /api/v1/tags/:id
router.delete("/:id", catchError(deleteTag));

export default router;
