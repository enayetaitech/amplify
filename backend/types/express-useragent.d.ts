// src/types/express-useragent.d.ts
import "express";
import { Details } from "express-useragent";
import { Logger } from "pino";

declare module "express-serve-static-core" {
  interface Request {
    useragent: Details;
    deviceInfo?: {
      ip: string;
      deviceType: "mobile" | "desktop" | "other";
      platform: string;
      browser: string;
      location: {
        country: string | null;
        region: string | null;
        city: string | null;
      };
    };
    log?: Logger;
  }
}
