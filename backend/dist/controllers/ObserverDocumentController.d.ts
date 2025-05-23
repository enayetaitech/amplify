import { Request, Response, NextFunction } from "express";
export declare const createObserverDocument: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/observer-documents/project/:projectId?page=&limit=
 * Returns observer documents for a project with pagination.
 */
export declare const getObserverDocumentsByProjectId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const downloadObserverDocument: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const downloadObserverDocumentsBulk: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /api/v1/observer-documents/:id
 * 1. Delete the file from S3
 * 2. Remove the MongoDB row
 * 3. Return the deleted doc
 */
export declare const deleteObserverDocument: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ObserverDocumentController.d.ts.map