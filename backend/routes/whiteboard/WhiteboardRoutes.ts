import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { createSnapshot } from "../../controllers/WhiteboardController";
import { uploadImage } from "../../utils/multer";

const router = express.Router();

// POST /api/v1/whiteboard/:sessionId/snapshot
router.post(
  "/:sessionId/snapshot",
  uploadImage.single("file"),
  catchError(createSnapshot)
);

export default router;
