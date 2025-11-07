// src/config/db.ts
import mongoose from "mongoose";
import config from "./index";
import { baseLogger } from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    if (!config.database_url) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const connectionOptions = {
      serverSelectionTimeoutMS: 30000, // 30 seconds (increased for Atlas)
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds (increased for Atlas)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      retryWrites: true,
      retryReads: true,
      bufferCommands: false, // Fail fast instead of buffering when disconnected
    };

    const conn = await mongoose.connect(
      config.database_url as string,
      connectionOptions
    );

    baseLogger.info(
      {
        host: conn.connection.host,
        name: conn.connection.name,
        readyState: conn.connection.readyState,
      },
      "MongoDB Connected successfully"
    );

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      baseLogger.error(
        {
          err,
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
        },
        "MongoDB connection error - operations may fail until reconnected"
      );
    });

    mongoose.connection.on("disconnected", () => {
      baseLogger.warn(
        {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
        },
        "MongoDB disconnected - attempting to reconnect automatically"
      );
    });

    mongoose.connection.on("reconnected", () => {
      baseLogger.info(
        {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
        },
        "MongoDB reconnected successfully"
      );
    });

    mongoose.connection.on("connecting", () => {
      baseLogger.info("MongoDB connecting...");
    });

    mongoose.connection.on("connected", () => {
      baseLogger.info(
        {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
        },
        "MongoDB connected and ready"
      );
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      baseLogger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    baseLogger.error(
      {
        err: error,
        database_url: config.database_url ? "***configured***" : "missing",
      },
      `Error connecting to MongoDB: ${errorMessage}`
    );

    // Provide helpful error messages with actionable steps
    if (errorMessage.includes("authentication failed")) {
      baseLogger.error(
        "❌ MongoDB authentication failed. ACTION: Verify username and password in MONGO_URI environment variable"
      );
    } else if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("getaddrinfo")
    ) {
      baseLogger.error(
        "❌ MongoDB host not found. ACTION: Check your connection string format and DNS resolution. Verify the cluster hostname in MongoDB Atlas"
      );
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("timed out")
    ) {
      baseLogger.error(
        "❌ MongoDB connection timeout. ACTION: 1) Check if your server IP (103.142.80.36) is whitelisted in MongoDB Atlas Network Access. 2) Verify firewall allows outbound connections to port 27017/443. 3) Check network connectivity from server to MongoDB Atlas"
      );
    } else if (
      errorMessage.includes("IP") ||
      errorMessage.includes("whitelist")
    ) {
      baseLogger.error(
        "❌ MongoDB IP whitelist error. ACTION: Add your server IP address to MongoDB Atlas → Network Access → IP Access List. Current server IP appears to be: 103.142.80.36"
      );
    } else if (errorMessage.includes("buffering")) {
      baseLogger.error(
        "❌ MongoDB operation buffering timeout. ACTION: Connection is not ready. Check if MongoDB is accessible and connection is established. This usually indicates the database connection dropped or was never established."
      );
    } else {
      baseLogger.error(
        `❌ MongoDB connection error: ${errorMessage}. ACTION: Review MongoDB Atlas dashboard for cluster status and check server network connectivity`
      );
    }

    process.exit(1);
  }
};

export default connectDB;
