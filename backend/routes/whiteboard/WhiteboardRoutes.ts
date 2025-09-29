import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import {
  openWhiteboard,
  closeWhiteboard,
  getWhiteboardHistory,
} from "../../controllers/WhiteboardController";

const router = express.Router();

router.post("/open", catchError(openWhiteboard));
router.post("/close", catchError(closeWhiteboard));
router.get("/history", catchError(getWhiteboardHistory));

export default router;
