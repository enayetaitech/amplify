// src/utils/tokenService.ts
import jwt from "jsonwebtoken";
import config from "../config/index";

export interface AccessPayload {
  userId: string;
  role: string;
}

export interface RefreshPayload {
  userId: string;
}

/** Sign an access token */
export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(
    payload,
    config.jwt_secret!,                               
    {
      expiresIn: config.jwt_access_token_expires_in as jwt.SignOptions["expiresIn"],
    }
  );
}

/** Sign a refresh token */
export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(
    payload,
    config.jwt_refresh_secret!,                       
    {
      expiresIn: config.jwt_refresh_token_expires_in as jwt.SignOptions["expiresIn"],
    }
  );
}

/** Verify an access token */
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, config.jwt_secret!) as AccessPayload;
}

/** Verify a refresh token */
export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, config.jwt_refresh_secret!) as RefreshPayload;
}

export function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: maxAgeMs,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict" as const,
  };
}


/**
 * Turn a string like "15m", "7d", "30s", "2h" into milliseconds.
 * Throws if the format is invalid.
 */
export function parseExpiryToMs(expiry: string): number {
  const m = /^(\d+)([smhd])$/.exec(expiry.trim());
  if (!m) {
    throw new Error(`Invalid expiry format: "${expiry}"`);
  }
  const value = Number(m[1]);
  switch (m[2]) {
    case "s":
      return value * 1_000;
    case "m":
      return value * 60_000;
    case "h":
      return value * 3_600_000;
    case "d":
      return value * 86_400_000;
    default:
      throw new Error(`Unsupported time unit "${m[2]}"`);
  }
}
