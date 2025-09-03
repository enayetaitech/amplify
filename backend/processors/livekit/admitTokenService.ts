import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config";

const SECRET = config.admit_jwt_secret!; // add to your env/config
const DEFAULT_TTL_SECONDS = 120;

/** Minimal one-time replay cache (replace with Redis in prod) */
const usedJti = new Map<string, number>(); // jti -> expiresAt(ms)
setInterval(() => {
  const now = Date.now();
  for (const [jti, exp] of usedJti) if (exp <= now) usedJti.delete(jti);
}, 30_000).unref();

export function createAdmitToken(params: {
  sessionId: string;
  email: string;
  name: string;
  ttlSeconds?: number;
}) {
  const { sessionId, email, name, ttlSeconds = DEFAULT_TTL_SECONDS } = params;
  const jti = crypto.randomUUID();

  return jwt.sign(
    { sessionId, email, name, role: "Participant", jti },
    SECRET,
    { expiresIn: ttlSeconds }
  );
}

export function verifyAdmitToken(token: string): {
  sessionId: string; email: string; name: string; role: "Participant"; jti?: string;
} {
  const payload = jwt.verify(token, SECRET) as any;

  if (!payload?.sessionId || !payload?.email || payload?.role !== "Participant") {
    throw new Error("Malformed admit token");
  }

  // one-time use guard
  if (payload.jti) {
    if (usedJti.has(payload.jti)) {
      throw new Error("Admit token already used");
    }
    usedJti.set(payload.jti, (payload.exp ?? 0) * 1000);
  }

  return payload;
}

/** stable identity without exposing email */
export function participantIdentity(sessionId: string, email: string) {
  const hash = crypto.createHash("sha256").update(email).digest("hex").slice(0, 24);
  return `p:${sessionId}:${hash}`;
}
