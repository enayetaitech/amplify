import { Request, Response, NextFunction } from "express";
import { ICustomError } from "../../shared/interface/ErrorInterface";
import ErrorHandler from "../utils/ErrorHandler";

const errorMiddleware = (
  err: ICustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // log before mutation/classification; req.log is added by pino-http
  try {
    // best-effort structured error log
    (req as any).log?.error({ err }, "Unhandled error");
  } catch {}
  // Set default values if not provided
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Handle CastError (e.g., invalid MongoDB ID)
  if (err.name === "CastError" && err.path) {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle Duplicate Key Error (e.g., duplicate field in MongoDB)
  if (err.code === 11000 && err.keyValue) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Handle Mongoose Connection Buffering Timeout
  if (
    err.name === "MongooseError" &&
    err.message?.includes("buffering timed out")
  ) {
    const message =
      "Database connection is not ready. Please try again in a moment. If the problem persists, contact support.";
    err = new ErrorHandler(message, 503); // 503 Service Unavailable
  }

  // Handle Mongoose Connection Errors
  if (
    err.name === "MongooseError" &&
    (err.message?.includes("connection") ||
      err.message?.includes("disconnected") ||
      err.message?.includes("not connected"))
  ) {
    const message =
      "Database connection error. The service is temporarily unavailable. Please try again shortly.";
    err = new ErrorHandler(message, 503);
  }

  // Handle invalid JWT token
  if (err.name === "JsonWebTokenError") {
    const message = "Json Web Token is invalid, try again";
    err = new ErrorHandler(message, 400);
  }

  // Handle expired JWT token
  if (err.name === "TokenExpiredError") {
    const message = "Json Web Token is expired, try again";
    err = new ErrorHandler(message, 400);
  }

  // Send the error response
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message,
  });
};

export default errorMiddleware;
