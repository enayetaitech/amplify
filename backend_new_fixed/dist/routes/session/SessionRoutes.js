"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SessionController_1 = require("../../controllers/SessionController");
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// POST /api/v1/sessions/
router.post("/", (0, CatchErrorMiddleware_1.catchError)(SessionController_1.createSessions));
// GET /api/v1/sessions/project/:projectId
router.get("/project/:projectId", (0, CatchErrorMiddleware_1.catchError)(SessionController_1.getSessionsByProject));
// GET /api/v1/sessions/:id
router.get("/:id", (0, CatchErrorMiddleware_1.catchError)(SessionController_1.getSessionById));
// PATCH /api/v1/sessions/:id
router.patch("/:id", (0, CatchErrorMiddleware_1.catchError)(SessionController_1.updateSession));
// POST /api/v1/sessions/:id/duplicate
router.post("/:id/duplicate", (0, CatchErrorMiddleware_1.catchError)(SessionController_1.duplicateSession));
// DELETE /api/v1/sessions/:d
router.delete("/:id", (0, CatchErrorMiddleware_1.catchError)(SessionController_1.deleteSession));
exports.default = router;
