// src/server.ts
import express from "express";
import type { RequestHandler } from "express";
import config from "./config/index";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/ErrorMiddleware";
import mainRoutes from "./routes/index";
import cors from "cors";
import cookieParser from "cookie-parser";
import { deviceInfoMiddleware } from "./middlewares/deviceInfo";
import httpLogger from "./middlewares/httpLogger";
import http from "http";
import { attachSocket } from "./socket/index";
import { rescheduleAllBreakoutTimers } from "./services/breakoutScheduler";
import { baseLogger } from "./utils/logger";
import cron from "node-cron";
import {
  sendClosingWarnings,
  closeIdleProjects,
  archiveClosedProjects,
} from "./services/projectStatusScheduler";
import { purgeExpiredDeliverables } from "./services/purgeDeliverables";
import { AuditLogModel } from "./model/AuditLog";
import { ensureSuperAdmin } from "./scripts/ensureSuperAdmin";

const app = express();
baseLogger.info(
  { frontendBaseUrl: config.frontend_base_url },
  "Starting server"
);

process.on("unhandledRejection", (err) => {
  baseLogger.error({ err }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  baseLogger.fatal({ err }, "Uncaught exception");
});
// ✅ CORS config
const allowedOrigins = [
  config.frontend_base_url as string,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://amplifyre.shop",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware to parse JSON bodies
app.use(express.json() as unknown as RequestHandler);
app.use(cookieParser() as unknown as RequestHandler);
app.set("trust proxy", true);
// this must come before any route that needs deviceInfo
app.use(...deviceInfoMiddleware);
app.use(httpLogger);

// Example route
app.get("/", (req, res) => {
  const bucket = config.s3_bucket_name;
  res.send("Hello World!, " + bucket);
});

// request logging handled by httpLogger

// Place your other routes here
app.use("/api/v1", mainRoutes);

// Error handling middleware should be added after routes
app.use(errorMiddleware);

// Create an HTTP server from Express
const server = http.createServer(app);

// Initialize Socket.IO on that server
attachSocket(server);

// Connect to the database and start the server
const PORT = config.port || 8008;
server.listen(PORT, async () => {
  await connectDB();
  baseLogger.info({ port: PORT }, "Server is running");
  try {
    await ensureSuperAdmin();
    baseLogger.info("SuperAdmin ensured/seeded");
  } catch (e) {
    baseLogger.error(
      { err: e instanceof Error ? e : { message: String(e) } },
      "Failed to ensure SuperAdmin"
    );
  }
  try {
    await rescheduleAllBreakoutTimers();
    baseLogger.info("Breakout timers rescheduled");
  } catch (e) {
    baseLogger.warn(
      { err: e instanceof Error ? e : { message: String(e) } },
      "Failed to reschedule breakout timers"
    );
  }
  // daily at 03:15 purge old audit logs based on retention
  const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS || 365);
  cron.schedule("15 3 * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const res = await AuditLogModel.deleteMany({
        createdAt: { $lt: cutoff },
      });
      baseLogger.info({ deleted: res.deletedCount }, "AuditLog purge complete");
    } catch (err) {
      baseLogger.error({ err }, "AuditLog purge failed");
    }
  });

  // daily at 03:30 run project status lifecycle tasks
  cron.schedule("30 3 * * *", async () => {
    try {
      await sendClosingWarnings();
      await closeIdleProjects();
      await archiveClosedProjects();
      baseLogger.info("Project status lifecycle cron completed");
    } catch (err) {
      baseLogger.error({ err }, "Project status lifecycle cron failed");
    }
  });

  // daily at 03:45 purge expired soft-deleted session deliverables
  cron.schedule("45 3 * * *", async () => {
    try {
      const { deleted, s3Errors } = await purgeExpiredDeliverables();
      baseLogger.info({ deleted, s3Errors }, "Deliverables purge completed");
    } catch (err) {
      baseLogger.error({ err }, "Deliverables purge failed");
    }
  });
});
