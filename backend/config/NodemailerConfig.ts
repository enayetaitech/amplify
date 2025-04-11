// src/config/nodemailer.config.ts
import nodemailer from 'nodemailer';
import config from "./index"
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});


export default transporter;
