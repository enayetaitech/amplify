import { Request, Response, NextFunction } from "express";
import { ICustomError } from "../../shared/interface/ErrorInterface";
import ErrorHandler from "../utils/ErrorHandler";

const errorMiddleware = (
  err: ICustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
