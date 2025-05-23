import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticateJwt";
export declare const authorizeRoles: (...allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authorizeRoles.d.ts.map