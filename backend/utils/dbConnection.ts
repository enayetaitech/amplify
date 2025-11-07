// Utility to check MongoDB connection state before operations
import mongoose from "mongoose";

/**
 * Check if MongoDB connection is ready
 * @returns true if connected, false otherwise
 */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1; // 1 = connected
}

/**
 * Get human-readable connection state
 */
export function getDbConnectionState(): string {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState as keyof typeof states] || "unknown";
}

/**
 * Wait for MongoDB connection to be ready (with timeout)
 * @param timeoutMs Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when connected or rejects on timeout
 */
export function waitForDbConnection(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDbConnected()) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      mongoose.connection.removeListener("connected", onConnected);
      reject(
        new Error(
          `Database connection timeout after ${timeoutMs}ms. Current state: ${getDbConnectionState()}`
        )
      );
    }, timeoutMs);

    const onConnected = () => {
      clearTimeout(timeout);
      mongoose.connection.removeListener("connected", onConnected);
      resolve();
    };

    mongoose.connection.once("connected", onConnected);
  });
}

