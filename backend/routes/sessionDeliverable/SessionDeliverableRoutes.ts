import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import multer from "multer";
import { createDeliverable, deleteDeliverable, downloadDeliverable, downloadMultipleDeliverable, getDeliverablesByProjectId } from "../../controllers/SessionDeliverableController";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });         

// POST   /api/v1/sessionDeliverables       
router.post("/", upload.single("file"), catchError(createDeliverable));


// GET    /api/v1/sessionDeliverables/project/:projectId?page=&limit=&type=
router.get(
  "/project/:projectId",
  catchError(getDeliverablesByProjectId)
);

// GET    /api/v1/sessionDeliverables/:id/download   
router.get("/:id/download", catchError(downloadDeliverable));

// POST   /api/v1/sessionDeliverables/download        
router.post("/download", catchError(downloadMultipleDeliverable));

// DELETE /api/v1/sessionDeliverables/:id             
router.delete("/:id", catchError(deleteDeliverable));

export default router;
