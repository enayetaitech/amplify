// src/middlewares/authorizeRoles.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticateJwt";
import ErrorHandler from "../utils/ErrorHandler";

export const authorizeRoles =
  (...allowedRoles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHandler("Not authenticated", 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ErrorHandler("Forbidden: insufficient permissions", 403));
    }
    next();
  };
