export interface AccessPayload {
    userId: string;
    role: string;
}
export interface RefreshPayload {
    userId: string;
}
/** Sign an access token */
export declare function signAccessToken(payload: AccessPayload): string;
/** Sign a refresh token */
export declare function signRefreshToken(payload: RefreshPayload): string;
/** Verify an access token */
export declare function verifyAccessToken(token: string): AccessPayload;
/** Verify a refresh token */
export declare function verifyRefreshToken(token: string): RefreshPayload;
export declare function cookieOptions(maxAgeMs: number): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict";
    maxAge: number;
};
/**
 * Turn a string like "15m", "7d", "30s", "2h" into milliseconds.
 * Throws if the format is invalid.
 */
export declare function parseExpiryToMs(expiry: string): number;
//# sourceMappingURL=tokenService.d.ts.map