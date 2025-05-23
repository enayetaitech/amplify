import { Request, Response, NextFunction } from "express";
/**
 * Controller to add a new moderator to a project.
 * - Validates input
 * - Prevents duplicate moderators on the same project
 * - Verifies project existence
 * - Looks up the project owner’s name
 * - Saves the new moderator
 * - Sends a “you’ve been added” email
 * - Returns a standardized success response
 */
export declare const addModerator: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Edit a moderator’s details.
 * - If the moderator.isVerified === true, only adminAccess can be updated.
 * - Otherwise, firstName, lastName, email, companyName, and adminAccess are all editable.
 */
export declare const editModerator: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get a single moderator by ID.
 */
export declare const getModeratorById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Toggle a moderator’s active status.
 * - If currently active, deactivates them.
 * - If currently inactive, reactivates them.
 */
export declare const toggleModeratorStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all moderators for a given project.
 */
export declare const getModeratorsByProjectId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ModeratorController.d.ts.map