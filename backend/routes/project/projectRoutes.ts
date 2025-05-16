
import express from 'express';
import { catchError } from '../../middlewares/CatchErrorMiddleware';
import { createProjectByExternalAdmin, editProject, emailProjectInfo, getProjectById, getProjectByUserId, saveProgress, toggleRecordingAccess } from '../../controllers/ProjectController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { authorizeRoles } from '../../middlewares/authorizeRoles';


const router = express.Router();

// POST /api/v1/projects/save-progress - Register a new user
router.post("/save-progress", catchError(saveProgress));

// POST /api/v1/projects/create-project-by-external-admin
router.post("/create-project-by-external-admin", catchError(createProjectByExternalAdmin));

// POST /api/v1/projects/email-project-info
router.post("/email-project-info", catchError(emailProjectInfo));

// POST /api/v1/projects/get-project-by-userId/:userId
router.get("/get-project-by-userId/:userId", authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"), catchError(getProjectByUserId));

// GET /api/v1/projects/get-project-by-id/:projectId 
router.get("/get-project-by-id/:projectId",authenticateJwt,
  authorizeRoles("SuperAdmin", "AmplifyAdmin", "Admin"), catchError(getProjectById));

// PATCH /api/v1/projects/edit-project 
router.patch("/edit-project", catchError(editProject));

// GET /api/v1/projects/toggle-recording-access
router.patch("/toggle-recording-access", catchError(toggleRecordingAccess));

export default router;
