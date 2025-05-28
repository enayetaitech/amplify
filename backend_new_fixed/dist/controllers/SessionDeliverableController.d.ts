import { Request, Response, NextFunction } from "express";
/**
 * POST /api/v1/deliverables
 * multipart/form-data:
 *   file         (binary)
 *   sessionId    (string)
 *   projectId    (string)
 *   type         (AUDIO | VIDEO | ...)
 *   uploadedBy   (string)  ← user _id
 *
 * Optional:
 *   displayName  (string)  ← if omitted, we auto-generate
 */
export declare const createDeliverable: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * List deliverables for a project with skip/limit pagination
 * and optional ?type=AUDIO | VIDEO | …
 */
export declare const getDeliverablesByProjectId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const downloadDeliverable: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const downloadMultipleDeliverable: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteDeliverable: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=SessionDeliverableController.d.ts.map