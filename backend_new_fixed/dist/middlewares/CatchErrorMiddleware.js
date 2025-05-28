"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchError = void 0;
/**
 * Higher-order function to catch errors in asynchronous route handlers.
 * Automatically forwards errors to Express error-handling middleware.
 *
 * @param handler - An asynchronous function handling an Express request.
 * @returns A function that wraps the handler and catches any errors.
 */
const catchError = (handler) => (req, res, next) => {
    handler(req, res, next).catch(next);
};
exports.catchError = catchError;
