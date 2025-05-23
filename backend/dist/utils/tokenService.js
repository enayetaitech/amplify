"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.cookieOptions = cookieOptions;
exports.parseExpiryToMs = parseExpiryToMs;
// src/utils/tokenService.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../config/index"));
/** Sign an access token */
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, index_1.default.jwt_secret, {
        expiresIn: index_1.default.jwt_access_token_expires_in,
    });
}
/** Sign a refresh token */
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, index_1.default.jwt_refresh_secret, {
        expiresIn: index_1.default.jwt_refresh_token_expires_in,
    });
}
/** Verify an access token */
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, index_1.default.jwt_secret);
}
/** Verify a refresh token */
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, index_1.default.jwt_refresh_secret);
}
function cookieOptions(maxAgeMs) {
    return {
        httpOnly: true,
        secure: index_1.default.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: maxAgeMs,
    };
}
/**
 * Turn a string like "15m", "7d", "30s", "2h" into milliseconds.
 * Throws if the format is invalid.
 */
function parseExpiryToMs(expiry) {
    const m = /^(\d+)([smhd])$/.exec(expiry.trim());
    if (!m) {
        throw new Error(`Invalid expiry format: "${expiry}"`);
    }
    const value = Number(m[1]);
    switch (m[2]) {
        case "s":
            return value * 1000;
        case "m":
            return value * 60000;
        case "h":
            return value * 3600000;
        case "d":
            return value * 86400000;
        default:
            throw new Error(`Unsupported time unit "${m[2]}"`);
    }
}
