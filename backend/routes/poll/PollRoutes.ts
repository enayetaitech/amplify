import express from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { createPoll, deletePoll, duplicatePoll, getPollById, getPollsByProjectId, updatePoll } from "../../controllers/PollController";
import { uploadImage } from "../../utils/multer";


const router = express.Router();

/* POST /api/v1/polls  – Create a new poll */
router.post("/", uploadImage.array("images", 20), catchError(createPoll));

// GET /api/v1/polls/project/:projectId?page=&limit=
router.get("/project/:projectId", catchError(getPollsByProjectId));

// GET /api/v1/polls/:id
router.get("/:id", catchError(getPollById));  

/* PATCH /api/v1/polls/:id  – Update a poll */
router.patch("/:id",   catchError(updatePoll));

/* POST /api/v1/polls/:id/duplicate  – Duplicate a  poll */
router.post("/:id/duplicate", catchError(duplicatePoll));

/* DELETE /api/v1/polls/:id  – Delete a  poll */
router.delete("/:id",  catchError(deletePoll));


export default router;
