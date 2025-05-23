"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = exports.catchError = void 0;
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
const sendResponse = (res, data, message = "Request successful", statusCode = 200, meta) => {
    const responsePayload = {
        success: true,
        message,
        data,
    };
    if (meta) {
        responsePayload.meta = meta;
    }
    return res.status(statusCode).json(responsePayload);
};
exports.sendResponse = sendResponse;
