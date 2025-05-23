"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const PollController_1 = require("../../controllers/PollController");
const router = express_1.default.Router();
/* POST /api/v1/polls  – Create a new poll */
router.post("/", (0, CatchErrorMiddleware_1.catchError)(PollController_1.createPoll));
// GET /api/v1/polls/project/:projectId?page=&limit=
router.get("/project/:projectId", (0, CatchErrorMiddleware_1.catchError)(PollController_1.getPollsByProjectId));
// GET /api/v1/polls/:id
router.get("/:id", (0, CatchErrorMiddleware_1.catchError)(PollController_1.getPollById));
/* PATCH /api/v1/polls/:id  – Update a poll */
router.patch("/:id", (0, CatchErrorMiddleware_1.catchError)(PollController_1.updatePoll));
/* POST /api/v1/polls/:id/duplicate  – Duplicate a  poll */
router.post("/:id/duplicate", (0, CatchErrorMiddleware_1.catchError)(PollController_1.duplicatePoll));
/* DELETE /api/v1/polls/:id  – Delete a  poll */
router.delete("/:id", (0, CatchErrorMiddleware_1.catchError)(PollController_1.deletePoll));
exports.default = router;
