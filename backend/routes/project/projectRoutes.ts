
import express from 'express';
import { catchError } from '../../middlewares/catchError.middleware';
import { saveProgress } from '../../controllers/project.controller';


const router = express.Router();

// POST /api/v1/projects/save-progress - Register a new user
router.post("/save-progress", catchError(saveProgress));

export default router;
