"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateJwt_1 = require("../../middlewares/authenticateJwt");
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const LiveSessionController_1 = require("../../controllers/LiveSessionController");
const router = express_1.default.Router();
// only moderators can start or end
// POST api/v1/liveSessions/:sessionId/start
router.post("/:sessionId/start", authenticateJwt_1.authenticateJwt, 
// authorizeRoles("Moderator"),
(0, CatchErrorMiddleware_1.catchError)(LiveSessionController_1.startSession));
// POST api/v1/liveSessions/:sessionId/end
router.post("/:sessionId/end", authenticateJwt_1.authenticateJwt, 
// authorizeRoles("Moderator"),
(0, CatchErrorMiddleware_1.catchError)(LiveSessionController_1.endSession));
// GET api/v1/liveSessions/:sessionId/history
router.get("/:sessionId/history", authenticateJwt_1.authenticateJwt, (0, CatchErrorMiddleware_1.catchError)(LiveSessionController_1.getSessionHistory));
exports.default = router;
