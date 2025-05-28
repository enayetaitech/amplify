import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}
export declare const authenticateJwt: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authenticateJwt.d.ts.map