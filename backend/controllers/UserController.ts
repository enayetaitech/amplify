import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import { sendResponse } from "../utils/responseHelpers";
import {
  resetPasswordEmailTemplate,
  verificationEmailTemplate,
} from "../constants/emailTemplates";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { sanitizeUser } from "../processors/user/removePasswordFromUserObjectProcessor";
import config from "../config/index";
import jwt from "jsonwebtoken";
import { isStrongPassword } from "../processors/user/isStrongPasswordProcessor";
import ProjectModel from "../model/ProjectModel";

import {
  cookieOptions,
  parseExpiryToMs,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenService";
import { AuthRequest } from "../middlewares/authenticateJwt";
import { Types } from "mongoose";

import { isValidEmail } from "../processors/isValidEmail";
import ModeratorModel from "../model/ModeratorModel";

export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    companyName,
    password,
    role,
    status,
    termsAccepted,
  } = req.body;

  // Check if the email format is valid
  if (!isValidEmail(email)) {
    return next(new ErrorHandler("Invalid email format", 400));
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  if (await User.findOne({ phoneNumber })) {
    return next(new ErrorHandler("phoneNumber already exists", 409));
  }

  if (!isStrongPassword(password)) {
    return next(
      new ErrorHandler(
        "Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.",
        400
      )
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    firstName,
    lastName,
    email,
    phoneNumber,
    companyName,
    password: hashedPassword,
    role,
    status: status || "Active",
    isEmailVerified: false,
    termsAccepted,
    termsAcceptedTime: new Date(),
    isDeleted: false,
    createdBy: "self",
    credits: 0,
    stripeCustomerId: undefined,
  });

  const savedUser = await newUser.save();

  // In createAccount controller, after saving the user
  const token = jwt.sign(
    { userId: savedUser._id },
    config.jwt_secret as string,
    { expiresIn: "1d" }
  );

  const verificationLink = `${config.frontend_base_url}/verify-email?token=${token}`;

  // Send verification email with token
  await sendEmail({
    to: savedUser.email,
    subject: "Verify Your Account",
    html: verificationEmailTemplate(savedUser.firstName, verificationLink),
  });

  const userResponse = sanitizeUser(savedUser);

  sendResponse(res, userResponse, "User registered successfully", 201);

  // Link new registrations to any pending team memberships and sync company name
  try {
    const result = await ModeratorModel.updateMany(
      { email: savedUser.email },
      {
        $set: {
          isVerified: true,
          // Ensure company name is synchronized with the user profile
          companyName: savedUser.companyName,
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(
        `Updated ${result.modifiedCount} existing moderator records for new user ${savedUser.email}`
      );
    }
  } catch (e) {
    try {
      console.error("Failed to link moderator memberships on signup", e);
    } catch {}
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  const { ip, deviceType, platform, browser, location } = (req as any)
    .deviceInfo;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  if (user.isDeleted) {
    return next(new ErrorHandler("Account has been deleted", 403));
  }

  if (user.status !== "Active") {
    return next(new ErrorHandler("Account is not active", 403));
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const idString =
    typeof user._id === "string"
      ? user._id
      : (user._id as Types.ObjectId).toString();

  const accessToken = signAccessToken({ userId: idString, role: user.role });

  const refreshToken = signRefreshToken({ userId: idString });

  // parse the expiry strings from config
  const accessMaxAge = parseExpiryToMs(config.jwt_access_token_expires_in!);

  const refreshMaxAge = parseExpiryToMs(config.jwt_refresh_token_expires_in!);

  // set the cookies
  res.cookie("accessToken", accessToken, cookieOptions(accessMaxAge));
  res.cookie("refreshToken", refreshToken, cookieOptions(refreshMaxAge));

  const userResponse = sanitizeUser(user);

  sendResponse(res, { user: userResponse }, "Login successful");
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // req.user is set by authenticateJwt
  const payload = req.user;
  if (!payload) {
    return next(new ErrorHandler("Not authenticated", 401));
  }

  const user = await User.findById(payload.userId);
  if (!user || user.isDeleted) {
    return next(new ErrorHandler("User not found", 404));
  }

  const userResponse = sanitizeUser(user);
  sendResponse(res, { user: userResponse }, "Current user retrieved", 200);
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if the account is deleted or inactive
  if (user.isDeleted) {
    return next(new ErrorHandler("This account has been deleted", 403));
  }

  if (user.status !== "Active") {
    return next(new ErrorHandler("Account is not active", 403));
  }

  // Generate a reset token valid for 1 hour
  const token = jwt.sign({ userId: user._id }, config.jwt_secret as string, {
    expiresIn: "1h",
  });

  // Use the provided email template function and modify it for a reset-password email
  const emailHtml = resetPasswordEmailTemplate(user.firstName, token);

  // Send the reset email
  await sendEmail({
    to: user.email,
    subject: "Password Reset Instructions",
    html: emailHtml,
  });

  sendResponse(
    res,
    null,
    "Password reset instructions sent to your email",
    200
  );
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return next(
      new ErrorHandler(
        "User id, old password, and new password are required",
        400
      )
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Additional checks for account status and deletion
  if (user.isDeleted) {
    return next(new ErrorHandler("This account has been deleted", 403));
  }
  if (user.status !== "Active") {
    return next(new ErrorHandler("Account is not active", 403));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Old password is incorrect", 401));
  }

  if (!isStrongPassword(newPassword)) {
    return next(
      new ErrorHandler(
        "Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.",
        400
      )
    );
  }

  const isSameAsOld = await bcrypt.compare(newPassword, user.password);
  if (isSameAsOld) {
    return next(
      new ErrorHandler(
        "New password must be different from the old password",
        400
      )
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  sendResponse(res, null, "Password changed successfully", 200);
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return next(new ErrorHandler("Verification token is required", 400));
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwt_secret as string);
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token", 400));
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.isEmailVerified = true;
  await user.save();

  sendResponse(res, null, "Email verified successfully", 200);
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return next(new ErrorHandler("Token and new password are required", 400));
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwt_secret as string);
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token", 400));
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!isStrongPassword(newPassword)) {
    return next(
      new ErrorHandler(
        "Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.",
        400
      )
    );
  }

  const isSameAsOld = await bcrypt.compare(newPassword, user.password);
  if (isSameAsOld) {
    return next(
      new ErrorHandler(
        "New password must be different from the old password",
        400
      )
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  sendResponse(res, null, "Password reset successful", 200);
};

export const editUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    companyName,
    address,
    city,
    state,
    postalCode,
    country,
  } = req.body;

  // Find the user by id
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // If email is being changed, require verification (2FA will be added in next step)
  if (email !== undefined && email.toLowerCase() !== user.email.toLowerCase()) {
    // Check if new email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && String(existingUser._id) !== String(id)) {
      return next(new ErrorHandler("Email already in use", 409));
    }
    // TODO: Implement 2FA verification before allowing email change
    // For now, we'll allow the change but mark email as unverified
    user.email = email.toLowerCase();
    user.isEmailVerified = false;
  }

  // Update only the allowed fields if provided
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (companyName !== undefined) user.companyName = companyName;

  // Update billing info
  if (
    address !== undefined ||
    city !== undefined ||
    state !== undefined ||
    postalCode !== undefined ||
    country !== undefined
  ) {
    if (!user.billingInfo) {
      user.billingInfo = {
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      };
    }
    if (address !== undefined) user.billingInfo.address = address;
    if (city !== undefined) user.billingInfo.city = city;
    if (state !== undefined) user.billingInfo.state = state;
    if (postalCode !== undefined) user.billingInfo.postalCode = postalCode;
    if (country !== undefined) user.billingInfo.country = country;
  }

  // Save the updated user document
  const updatedUser = await user.save();

  // Sync changes to all project team records for this user
  try {
    const updateFields: Record<string, string> = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;

    // Ensure company name is synchronized across all project teams
    if (companyName !== undefined) {
      updateFields.companyName = companyName;
      console.log(
        `Syncing company name change to '${companyName}' for user ${user.email}`
      );
    }

    // If email changed, update it in project teams too
    if (
      email !== undefined &&
      email.toLowerCase() !== user.email.toLowerCase()
    ) {
      updateFields.email = email.toLowerCase();
    }

    if (Object.keys(updateFields).length > 0) {
      const result = await ModeratorModel.updateMany(
        { email: user.email },
        { $set: updateFields }
      );
      console.log(
        `Updated ${result.modifiedCount} project team records for user ${user.email}`
      );
    }
  } catch (e) {
    // Log error but don't fail the request
    console.error("Failed to sync user changes to project teams:", e);
  }

  // Sanitize and send the updated user response
  const userResponse = sanitizeUser(updatedUser);
  sendResponse(res, userResponse, "User updated successfully");
};

/**
 * POST /api/v1/users/:id/request-email-change
 * Request to change email - sends verification code to new email
 */
export const requestEmailChange = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const { newEmail } = req.body;

  if (!newEmail) {
    return next(new ErrorHandler("New email is required", 400));
  }

  // Find the user
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if new email is same as current
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    return next(
      new ErrorHandler("New email is the same as current email", 400)
    );
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
  if (existingUser) {
    return next(new ErrorHandler("Email already in use", 409));
  }

  // Generate 6-digit verification code
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // Store code temporarily (expires in 15 minutes)
  user.emailVerificationCode = verificationCode;
  user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  user.pendingEmail = newEmail.toLowerCase();
  await user.save();

  // Send verification email
  try {
    await sendEmail({
      to: newEmail,
      subject: "Verify Your New Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E656D;">Email Verification Required</h2>
          <p>Hello ${user.firstName},</p>
          <p>You requested to change your email address. Please use the verification code below to confirm this change:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1E656D; font-size: 32px; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this change, please ignore this email.</p>
        </div>
      `,
    });
  } catch (e) {
    return next(new ErrorHandler("Failed to send verification email", 500));
  }

  sendResponse(res, null, "Verification code sent to new email", 200);
};

/**
 * POST /api/v1/users/:id/verify-email-change
 * Verify the code and complete email change
 */
export const verifyEmailChange = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const { verificationCode } = req.body;

  if (!verificationCode) {
    return next(new ErrorHandler("Verification code is required", 400));
  }

  // Find the user
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if there's a pending email change
  if (
    !user.pendingEmail ||
    !user.emailVerificationCode ||
    !user.emailVerificationExpires
  ) {
    return next(new ErrorHandler("No pending email change found", 400));
  }

  // Check if code expired
  if (new Date() > user.emailVerificationExpires) {
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.pendingEmail = undefined;
    await user.save();
    return next(
      new ErrorHandler(
        "Verification code expired. Please request a new one.",
        400
      )
    );
  }

  // Verify code
  if (user.emailVerificationCode !== verificationCode) {
    return next(new ErrorHandler("Invalid verification code", 400));
  }

  // Update email and sync to project teams
  const oldEmail = user.email;
  user.email = user.pendingEmail;
  user.isEmailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  user.pendingEmail = undefined;

  await user.save();

  // Sync email change to project teams
  try {
    const result = await ModeratorModel.updateMany(
      { email: oldEmail },
      {
        $set: {
          email: user.email,
          // Also ensure company name is in sync
          companyName: user.companyName,
        },
      }
    );
    console.log(
      `Updated ${result.modifiedCount} project team records for email change from ${oldEmail} to ${user.email}`
    );
  } catch (e) {
    console.error("Failed to sync email to project teams:", e);
  }

  // Sanitize and send response
  const userResponse = sanitizeUser(user);
  sendResponse(res, userResponse, "Email updated successfully");
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user id from route parameters.
  const { id } = req.params;

  // Check if the user exists.
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Fixed default user id to be used as replacement for project createdBy field.
  const defaultUserId = "67f35a519c899e0dc4b6dee5";

  // Update all projects where this user is the creator.
  await ProjectModel.updateMany(
    { createdBy: user._id },
    { $set: { createdBy: defaultUserId } }
  );

  // Instead of deleting the user, update the isDeleted field to true.
  user.isDeleted = true;
  await user.save();

  // Send a success response.
  sendResponse(res, null, "User deleted successfully", 200);
};

export const findUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req.query._id || req.query.id) as string;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    return next(new ErrorHandler("User not found", 404));
  }

  sendResponse(res, user, "User retrieved successfully", 200);
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return next(new ErrorHandler("No refresh token", 401));
  }

  const { userId } = verifyRefreshToken(token);
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (user.status !== "Active" || user.isDeleted) {
    return next(new ErrorHandler("Account is not active", 403));
  }

  // sign a fresh access token
  const newAccessToken = signAccessToken({
    userId,
    role: user.role,
  });

  // convert your expiry‐string to a number
  const accessMaxAge = parseExpiryToMs(config.jwt_access_token_expires_in!);

  // set the cookie
  res.cookie("accessToken", newAccessToken, cookieOptions(accessMaxAge));

  sendResponse(res, null, "Access token refreshed", 200);
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  sendResponse(res, null, "Logged out successfully", 200);
};
