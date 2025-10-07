import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import {
  createPoll,
  deletePoll,
  duplicatePoll,
  getPollById,
  getPollsByProjectId,
  updatePoll,
  launchPoll,
  stopPoll,
  respondToPoll,
} from "../../controllers/PollController";
import { uploadImage } from "../../utils/multer";

const router = express.Router();

/* POST /api/v1/polls  – Create a new poll */
router.post("/", uploadImage.array("images", 20), catchError(createPoll));

// GET /api/v1/polls/project/:projectId?page=&limit=
router.get("/project/:projectId", catchError(getPollsByProjectId));

// GET /api/v1/polls/:id
router.get("/:id", catchError(getPollById));

/* PATCH /api/v1/polls/:id  – Update a poll */
router.patch("/:id", uploadImage.array("images", 20), catchError(updatePoll));

/* POST /api/v1/polls/:id/duplicate  – Duplicate a  poll */
router.post("/:id/duplicate", catchError(duplicatePoll));

// Launch a poll for a live session
router.post("/:id/launch", catchError(launchPoll));

// Stop an open poll run for a session
router.post("/:id/stop", catchError(stopPoll));

// Participant responds to poll
router.post("/:id/respond", catchError(respondToPoll));

/* DELETE /api/v1/polls/:id  – Delete a  poll */
router.delete("/:id", catchError(deletePoll));

export default router;
