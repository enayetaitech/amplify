import config from "../config/index";


export const verificationEmailTemplate = (name: string, token: string): string => `
  <p>Dear ${name},</p>
  <p>Thank you for signing up to host your project on the Amplify Research Virtual Backroom platform. Please click the link below to verify your account information:</p>
  <p><a href="${config.frontend_base_url}/verify-email?token=${token}">Verify Your Account</a></p>
  <p>You will not be able to set up project details or conduct any sessions until this step is complete, so we encourage you to do this immediately upon receipt of this email.</p>
  <p>Thank you!</p>
  <p>The Amplify Team</p>
`;


// src/constants/resetPasswordEmailTemplate.ts

export const resetPasswordEmailTemplate = (name: string, token: string): string => `
  <p>Hi ${name},</p>
  <p>Please copy the link below to reset your password:</p>
  <p>
    <a href="${process.env.FRONTEND_BASE_URL}/resetPassword?token=${token}">
      Reset Your Password
    </a>
  </p>
  <p>If you did not request a password reset, please ignore this email.</p>
  <p>Thank you!</p>
  <p>The Amplify Team</p>
`;

