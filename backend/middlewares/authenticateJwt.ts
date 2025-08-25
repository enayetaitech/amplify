// src/middlewares/authenticateJwt.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokenService";
import ErrorHandler from "../utils/ErrorHandler";

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const authenticateJwt = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  
  const token = req.cookies.accessToken;
  console.log("token", token);
  if (!token) {
    return next(new ErrorHandler("Not authenticated", 401));
  }

  try {
    // throws if invalid/expired
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new ErrorHandler("Invalid or expired access token", 401));
  }
};
