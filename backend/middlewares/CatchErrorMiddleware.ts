import { Request, Response, NextFunction } from "express";

/**
 * Higher-order function to catch errors in asynchronous route handlers.
 * Automatically forwards errors to Express error-handling middleware.
 *
 * @param handler - An asynchronous function handling an Express request.
 * @returns A function that wraps the handler and catches any errors.
 */
export const catchError = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction): void => {
  handler(req, res, next).catch(next);
};
