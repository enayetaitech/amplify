// src/routes/livekit/LivekitRoutes.ts
import express from 'express';
import { authenticateJwt } from '../../middlewares/authenticateJwt';
import { catchError } from '../../middlewares/CatchErrorMiddleware';
import { getLivekitToken } from '../../controllers/LivekitController';
import { getObserverHls } from '../../controllers/LiveReadController';

const router = express.Router();

// POST /api/v1/livekit/token
router.post('/token', authenticateJwt, catchError(getLivekitToken));

// POST /api/v1/livekit/:sessionId/hls
router.get('/:sessionId/hls', getObserverHls);

export default router;
