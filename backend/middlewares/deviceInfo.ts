// src/middlewares/deviceInfo.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import requestIp from "request-ip";
import useragent from "express-useragent";
import geoip, { Lookup } from "geoip-lite";

export const deviceInfoMiddleware: RequestHandler[] = [
  // 1) populate `req.useragent`
  useragent.express(),

  // 2) our own middleware
  (req: Request, res: Response, next: NextFunction) => {
    // Prefer a public client IP from forwarded headers; fallback to request-ip
    const normalizeIp = (raw: string | undefined | null): string => {
      const v = (raw || "").trim();
      if (!v) return "";
      // strip IPv6-mapped v4 prefix
      if (v.startsWith("::ffff:")) return v.substring(7);
      // strip brackets around IPv6 if any
      if (v.startsWith("[") && v.endsWith("]")) return v.slice(1, -1);
      return v;
    };

    const isPrivateOrLocal = (ipStr: string): boolean => {
      const ip = ipStr.toLowerCase();
      if (!ip) return true;
      // loopback
      if (ip === "::1" || ip === "127.0.0.1" || ip.endsWith("127.0.0.1"))
        return true;
      // RFC1918, link-local IPv4
      if (
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("169.254.")
      )
        return true;
      if (ip.startsWith("172.")) {
        const parts = ip.split(".");
        if (parts.length >= 2) {
          const second = Number(parts[1]);
          if (second >= 16 && second <= 31) return true;
        }
      }
      // Unique local / link-local IPv6
      if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80"))
        return true;
      return false;
    };

    const headerCandidates: string[] = [];
    const xff = (req.headers["x-forwarded-for"] as string | undefined) || "";
    if (xff) {
      for (const part of xff.split(","))
        headerCandidates.push(normalizeIp(part));
    }
    const cf = normalizeIp(
      req.headers["cf-connecting-ip"] as string | undefined
    );
    if (cf) headerCandidates.unshift(cf);
    const xr = normalizeIp(req.headers["x-real-ip"] as string | undefined);
    if (xr) headerCandidates.unshift(xr);
    const xc = normalizeIp(req.headers["x-client-ip"] as string | undefined);
    if (xc) headerCandidates.unshift(xc);

    let chosen = "";
    for (const cand of headerCandidates) {
      if (cand && !isPrivateOrLocal(cand)) {
        chosen = cand;
        break;
      }
    }
    if (!chosen) {
      chosen = normalizeIp(requestIp.getClientIp(req) || "");
    }
    const ip = chosen;

    // unwrap the typed `req.useragent`
    const ua = req.useragent; // now TS knows this is `Details`
    const deviceType = ua.isMobile
      ? "mobile"
      : ua.isDesktop
      ? "desktop"
      : "other";

    // typed lookup
    const geo: Lookup | null = geoip.lookup(ip);
    const location = {
      country: geo?.country ?? null,
      region: geo?.region ?? null,
      city: geo?.city ?? null,
    };

    // attach a fully typed object
    req.deviceInfo = {
      ip,
      deviceType,
      platform: ua.platform,
      browser: ua.browser,
      location,
    };

    next();
  },
];
