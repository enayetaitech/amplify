import express from "express";
import multer from "multer";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { createObserverDocument, deleteObserverDocument, downloadObserverDocument, downloadObserverDocumentsBulk, getObserverDocumentsByProjectId } from "../../controllers/ObserverDocumentController";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST   /api/v1/observerDocuments 
router.post("/", upload.single("file"),
  catchError(createObserverDocument)
);

// GET   /api/v1/observerDocuments/project/:projectId 
router.get(
  "/project/:projectId",
  catchError(getObserverDocumentsByProjectId)
);

// GET   /api/v1/observerDocuments/:id/download 
router.get("/:id/download", catchError(downloadObserverDocument));

// POST   /api/v1/observerDocuments/download

router.post("/download", catchError(downloadObserverDocumentsBulk));

/* DELETE /api/v1/observerDocuments/:id */
router.delete("/:id", catchError(deleteObserverDocument));

export default router;
