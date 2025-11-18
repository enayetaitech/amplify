import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env file from the backend directory root
// When compiled, __dirname will be backend/dist/config, so we need to go up 2 levels
// When running from source, __dirname will be backend/config, so we go up 1 level
const backendDir = __dirname.includes("dist")
  ? path.resolve(__dirname, "../..") // From dist/config to backend root
  : path.resolve(__dirname, ".."); // From config to backend root

const envPath = path.resolve(backendDir, ".env");

// Load the .env file
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  const dbUrl = process.env.MONGO_URI;
  const dbName = dbUrl ? dbUrl.match(/\/([^?]+)/)?.[1] || "unknown" : "missing";
  console.log(`✓ Loaded environment from: ${envPath}`);
  console.log(
    `  Database: ${dbName} (MONGO_URI: ${dbUrl ? "configured" : "missing"})`
  );
} else {
  // Fallback to default dotenv behavior (current working directory)
  dotenv.config();
  console.warn(`⚠️  .env not found at ${envPath}`);
  console.warn(`  Falling back to process.cwd(): ${process.cwd()}`);
  console.warn(
    `  This may cause incorrect environment variables to be loaded!`
  );
}

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("Both JWT_SECRET and JWT_REFRESH_SECRET must be set");
}

export default {
  port: process.env.PORT,
  database_url: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,

  jwt_secret: process.env.JWT_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,

  jwt_access_token_expires_in: process.env.ACCESS_TOKEN_EXPIRES_IN!,
  jwt_refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN!,

  session_secret: process.env.SESSION_SECRET,
  admit_jwt_secret: process.env.ADMIT_JWT_SECRET,

  frontend_base_url: process.env.FRONTEND_BASE_URL,

  cloudinary_cloud_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_SECRET,

  next_payment_gateway_public_key: process.env.NEXT_PAYMENT_GATEWAY_PUBLIC_KEY,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,

  s3_access_key: process.env.S3_ACCESS_KEY,
  s3_secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
  s3_bucket_name: process.env.S3_BUCKET_NAME,
  s3_bucket_region: process.env.S3_REGION,

  hls_base_url: process.env.HLS_PUBLIC_BASE,
  enable_breakout_file_recording: process.env.ENABLE_BREAKOUT_FILE_RECORDING,

  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,

  livekit_api_key: process.env.LIVEKIT_API_KEY,
  livekit_api_secret: process.env.LIVEKIT_API_SECRET,
  livekit_ws_url: process.env.LIVEKIT_WS_URL,
};
