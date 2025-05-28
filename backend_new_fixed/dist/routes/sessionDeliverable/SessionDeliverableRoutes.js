"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const multer_1 = __importDefault(require("multer"));
const SessionDeliverableController_1 = require("../../controllers/SessionDeliverableController");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// POST   /api/v1/sessionDeliverables       
router.post("/", upload.single("file"), (0, CatchErrorMiddleware_1.catchError)(SessionDeliverableController_1.createDeliverable));
// GET    /api/v1/sessionDeliverables/project/:projectId?page=&limit=&type=
router.get("/project/:projectId", (0, CatchErrorMiddleware_1.catchError)(SessionDeliverableController_1.getDeliverablesByProjectId));
// GET    /api/v1/sessionDeliverables/:id/download   
router.get("/:id/download", (0, CatchErrorMiddleware_1.catchError)(SessionDeliverableController_1.downloadDeliverable));
// POST   /api/v1/sessionDeliverables/download        
router.post("/download-bulk", (0, CatchErrorMiddleware_1.catchError)(SessionDeliverableController_1.downloadMultipleDeliverable));
// DELETE /api/v1/sessionDeliverables/:id             
router.delete("/:id", (0, CatchErrorMiddleware_1.catchError)(SessionDeliverableController_1.deleteDeliverable));
exports.default = router;
