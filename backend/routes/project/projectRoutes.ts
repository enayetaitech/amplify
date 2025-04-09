
import express from 'express';
import { catchError } from '../../middlewares/catchError.middleware';
import { createProjectByExternalAdmin, emailProjectInfo, saveProgress } from '../../controllers/project.controller';


const router = express.Router();

// POST /api/v1/projects/save-progress - Register a new user
router.post("/save-progress", catchError(saveProgress));

// POST /api/v1/projects/create-project-by-external-admin
router.post("/create-project-by-external-admin", catchError(createProjectByExternalAdmin));

// POST /api/v1/projects/email-project-info
router.post("/email-project-info", catchError(emailProjectInfo));


export default router;
