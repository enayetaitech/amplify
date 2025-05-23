// src/middlewares/deviceInfo.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import requestIp from 'request-ip';
import useragent from 'express-useragent';
import geoip, { Lookup } from 'geoip-lite';

export const deviceInfoMiddleware: RequestHandler[] = [
  // 1) populate `req.useragent`
  useragent.express(),

  // 2) our own middleware
  (req: Request, res: Response, next: NextFunction) => {
    // get the IP
    const ip = requestIp.getClientIp(req) || '';

    // unwrap the typed `req.useragent`
    const ua = req.useragent;             // now TS knows this is `Details`
    const deviceType = ua.isMobile
      ? 'mobile'
      : ua.isDesktop
      ? 'desktop'
      : 'other';

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
