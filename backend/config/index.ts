import dotenv from "dotenv";
dotenv.config();


if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("Both JWT_SECRET and JWT_REFRESH_SECRET must be set");
}

export default {
  port: process.env.PORT,
  database_url: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  
  jwt_secret: process.env.JWT_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET, 

  jwt_access_token_expires_in : process.env.ACCESS_TOKEN_EXPIRES_IN!,
  jwt_refresh_token_expires_in : process.env.REFRESH_TOKEN_EXPIRES_IN!,


  session_secret: process.env.SESSION_SECRET,
  
  frontend_base_url: process.env.FRONTEND_BASE_URL,
  
  cloudinary_cloud_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_SECRET,
  
  next_payment_gateway_public_key: process.env.NEXT_PAYMENT_GATEWAY_PUBLIC_KEY,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  
  s3_access_key: process.env.S3_ACCESS_KEY,
  s3_secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
  s3_bucket_name: process.env.S3_BUCKET_NAME,
  
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  SMTP_USER:process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM
};
