import { Request, Response, NextFunction } from "express";
export declare const createPoll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/polls/project/:projectId
 * Query params: ?page=1&limit=10
 */
export declare const getPollsByProjectId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/polls/:id
 * Fetch a single poll by its ID.
 */
export declare const getPollById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * PATCH /api/v1/polls/:id
 * Body may include any of: title, questions (full array), isRun
 */
export declare const updatePoll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/polls/:id/duplicate
 * Clone an existing poll (questions, metadata) into a new document.
 */
export declare const duplicatePoll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /api/v1/polls/:id
 * Remove a poll by its ID.
 */
export declare const deletePoll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=PollController.d.ts.map