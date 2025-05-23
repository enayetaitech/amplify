// src/config/db.ts
import mongoose from "mongoose";
import config from "./index";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.database_url as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
