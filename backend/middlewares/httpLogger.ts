import { Request, Response } from "express";
import pinoHttp from "pino-http";
import { baseLogger } from "../utils/logger";
import { randomUUID } from "node:crypto";

const httpLogger = pinoHttp({
  logger: baseLogger,
  genReqId: (req: Request, res: Response): string => {
    const existing = (req.headers["x-request-id"] ||
      req.headers["x-correlation-id"]) as string | undefined;
    if (existing) return existing;
    const id = randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customProps: (req: Request, _res: Response) => {
    return {
      ip: req.deviceInfo?.ip,
      deviceType: req.deviceInfo?.deviceType,
      platform: req.deviceInfo?.platform,
      browser: req.deviceInfo?.browser,
    };
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});

export default httpLogger;
