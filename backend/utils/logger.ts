import pino, { LoggerOptions } from "pino";

const isDev = process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL || (isDev ? "debug" : "info");

const options: LoggerOptions = {
  level,
  redact: {
    paths: [
      "req.headers",
      "res.headers",
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.confirmPassword",
      "req.body.token",
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const baseLogger = pino(
  options,
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
        },
      })
    : undefined
);
