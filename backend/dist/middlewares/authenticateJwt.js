"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = void 0;
const tokenService_1 = require("../utils/tokenService");
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const authenticateJwt = (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return next(new ErrorHandler_1.default("Not authenticated", 401));
    }
    try {
        // throws if invalid/expired
        const payload = (0, tokenService_1.verifyAccessToken)(token);
        req.user = { userId: payload.userId, role: payload.role };
        next();
    }
    catch (_a) {
        next(new ErrorHandler_1.default("Invalid or expired access token", 401));
    }
};
exports.authenticateJwt = authenticateJwt;
