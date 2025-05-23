import { Request, Response, NextFunction } from "express";
export declare const createSessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /sessions/project/:projectId
 * Fetch all sessions for a given project
 */
export declare const getSessionsByProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /sessions/:id
 * Fetch a single session by its ID
 */
export declare const getSessionById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const duplicateSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=SessionController.d.ts.map