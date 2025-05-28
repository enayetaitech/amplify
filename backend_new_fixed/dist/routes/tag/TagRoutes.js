"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const TagController_1 = require("../../controllers/TagController");
const router = express_1.default.Router();
// POST /api/v1/tags
router.post("/", (0, CatchErrorMiddleware_1.catchError)(TagController_1.createTag));
// GET    /api/v1/tags/project/:projectId
router.get("/project/:projectId", (0, CatchErrorMiddleware_1.catchError)(TagController_1.getTagsByProjectId));
// GET    /api/v1/tags/user/:userId
router.get("/user/:userId", (0, CatchErrorMiddleware_1.catchError)(TagController_1.getTagsByUserId));
// PATCH  /api/v1/tags/:id
router.patch("/:id", (0, CatchErrorMiddleware_1.catchError)(TagController_1.editTag));
// DELETE /api/v1/tags/:id
router.delete("/:id", (0, CatchErrorMiddleware_1.catchError)(TagController_1.deleteTag));
exports.default = router;
