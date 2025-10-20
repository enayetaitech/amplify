import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Higher-order function to catch errors in asynchronous route handlers.
 * Automatically forwards errors to Express error-handling middleware.
 *
 * @param handler - An asynchronous function handling an Express request.
 * @returns A function that wraps the handler and catches any errors.
 */
export const catchError = (
  handler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void | Response | Promise<void | Response>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
