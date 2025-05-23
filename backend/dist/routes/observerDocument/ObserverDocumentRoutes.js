"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const ObserverDocumentController_1 = require("../../controllers/ObserverDocumentController");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// POST   /api/v1/observerDocuments 
router.post("/", upload.single("file"), (0, CatchErrorMiddleware_1.catchError)(ObserverDocumentController_1.createObserverDocument));
// GET   /api/v1/observerDocuments/project/:projectId 
router.get("/project/:projectId", (0, CatchErrorMiddleware_1.catchError)(ObserverDocumentController_1.getObserverDocumentsByProjectId));
// GET   /api/v1/observerDocuments/:id/download 
router.get("/:id/download", (0, CatchErrorMiddleware_1.catchError)(ObserverDocumentController_1.downloadObserverDocument));
// POST   /api/v1/observerDocuments/download
router.post("/download-bulk", (0, CatchErrorMiddleware_1.catchError)(ObserverDocumentController_1.downloadObserverDocumentsBulk));
/* DELETE /api/v1/observerDocuments/:id */
router.delete("/:id", (0, CatchErrorMiddleware_1.catchError)(ObserverDocumentController_1.deleteObserverDocument));
exports.default = router;
