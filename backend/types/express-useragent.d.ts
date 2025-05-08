// src/types/express-useragent.d.ts
import 'express';
import { Details } from 'express-useragent';
import { Lookup } from 'geoip-lite';

declare module 'express-serve-static-core' {
  interface Request {
    useragent: Details;
    deviceInfo?: {
      ip: string;
      deviceType: 'mobile' | 'desktop' | 'other';
      platform: string;
      browser: string;
      location: {
        country: string | null;
        region: string | null;
        city: string | null;
      }
    };
  }
}
