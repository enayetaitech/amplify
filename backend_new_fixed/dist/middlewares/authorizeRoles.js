"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return next(new ErrorHandler_1.default("Not authenticated", 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
        return next(new ErrorHandler_1.default("Forbidden: insufficient permissions", 403));
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
