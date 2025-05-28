import { Request, Response, NextFunction } from "express";
/**
 * Higher-order function to catch errors in asynchronous route handlers.
 * Automatically forwards errors to Express error-handling middleware.
 *
 * @param handler - An asynchronous function handling an Express request.
 * @returns A function that wraps the handler and catches any errors.
 */
export declare const catchError: (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Reusable function to send a standardized JSON response.
 *
 * @param res - The Express response object.
 * @param data - The data to include in the response.
 * @param message - A custom message for the response (default is "Request successful").
 * @param statusCode - HTTP status code (default is 200).
 * @param meta - Optional metadata to include in the response.
 * @returns A JSON response with a consistent format.
 */
export declare const sendResponse: <T, U>(res: Response, data: T, message?: string, statusCode?: number, meta?: U) => Response;
//# sourceMappingURL=responseHelpers.d.ts.map