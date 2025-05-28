import { Request, Response, NextFunction } from "express";
export declare const startSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const endSession: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getSessionHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=LiveSessionController.d.ts.map