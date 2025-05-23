"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const errorMiddleware = (err, req, res, next) => {
    var _a;
    // Set default values if not provided
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    // Handle CastError (e.g., invalid MongoDB ID)
    if (err.name === "CastError" && err.path) {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler_1.default(message, 400);
    }
    // Handle Duplicate Key Error (e.g., duplicate field in MongoDB)
    if (err.code === 11000 && err.keyValue) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler_1.default(message, 400);
    }
    // Handle invalid JWT token
    if (err.name === "JsonWebTokenError") {
        const message = "Json Web Token is invalid, try again";
        err = new ErrorHandler_1.default(message, 400);
    }
    // Handle expired JWT token
    if (err.name === "TokenExpiredError") {
        const message = "Json Web Token is expired, try again";
        err = new ErrorHandler_1.default(message, 400);
    }
    // Send the error response
    res.status((_a = err.statusCode) !== null && _a !== void 0 ? _a : 500).json({
        success: false,
        message: err.message,
    });
};
exports.default = errorMiddleware;
