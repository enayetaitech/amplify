import { Request, Response, NextFunction } from "express";
export declare const saveProgress: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createProjectByExternalAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const emailProjectInfo: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProjectByUserId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProjectById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const editProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const toggleRecordingAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ProjectController.d.ts.map