"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.refreshToken = exports.findUserById = exports.deleteUser = exports.editUser = exports.resetPassword = exports.verifyEmail = exports.changePassword = exports.forgotPassword = exports.getCurrentUser = exports.loginUser = exports.createAccount = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserModel_1 = __importDefault(require("../model/UserModel"));
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const ResponseHelpers_1 = require("../utils/ResponseHelpers");
const emailTemplates_1 = require("../constants/emailTemplates");
const SendVerifyAccountEmailProcessor_1 = require("../processors/sendEmail/SendVerifyAccountEmailProcessor");
const RemovePasswordFromUserObjectProcessor_1 = require("../processors/user/RemovePasswordFromUserObjectProcessor");
const index_1 = __importDefault(require("../config/index"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const IsStrongPasswordProcessor_1 = require("../processors/user/IsStrongPasswordProcessor");
const ProjectModel_1 = __importDefault(require("../model/ProjectModel"));
const IsValidEmailProcessor_1 = require("../processors/user/IsValidEmailProcessor");
const tokenService_1 = require("../utils/tokenService");
const createAccount = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, phoneNumber, companyName, password, role, status, termsAccepted, } = req.body;
    // Check if the email format is valid
    if (!(0, IsValidEmailProcessor_1.isValidEmail)(email)) {
        return next(new ErrorHandler_1.default("Invalid email format", 400));
    }
    const existingUser = yield UserModel_1.default.findOne({ email });
    if (existingUser) {
        return next(new ErrorHandler_1.default("User already exists", 400));
    }
    if (yield UserModel_1.default.findOne({ phoneNumber })) {
        return next(new ErrorHandler_1.default("phoneNumber already exists", 409));
    }
    if (!(0, IsStrongPasswordProcessor_1.isStrongPassword)(password)) {
        return next(new ErrorHandler_1.default("Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.", 400));
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    const newUser = new UserModel_1.default({
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
    const savedUser = yield newUser.save();
    // In createAccount controller, after saving the user
    const token = jsonwebtoken_1.default.sign({ userId: savedUser._id }, index_1.default.jwt_secret, { expiresIn: "1d" });
    // Send verification email with token
    yield (0, SendVerifyAccountEmailProcessor_1.sendEmail)({
        to: savedUser.email,
        subject: "Verify Your Account",
        html: (0, emailTemplates_1.verificationEmailTemplate)(savedUser.firstName, token),
    });
    const userResponse = (0, RemovePasswordFromUserObjectProcessor_1.sanitizeUser)(savedUser);
    (0, ResponseHelpers_1.sendResponse)(res, userResponse, "User registered successfully", 201);
});
exports.createAccount = createAccount;
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const { ip, deviceType, platform, browser, location } = req.deviceInfo;
    if (!email || !password) {
        return next(new ErrorHandler_1.default("Email and password are required", 400));
    }
    const user = yield UserModel_1.default.findOne({ email });
    if (!user) {
        return next(new ErrorHandler_1.default("Invalid credentials", 401));
    }
    if (user.isDeleted) {
        return next(new ErrorHandler_1.default("Account has been deleted", 403));
    }
    if (user.status !== "Active") {
        return next(new ErrorHandler_1.default("Account is not active", 403));
    }
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        console.log('Invalid credentials');
        return next(new ErrorHandler_1.default("Invalid credentials", 401));
    }
    const idString = typeof user._id === 'string'
        ? user._id
        : user._id.toString();
    const accessToken = (0, tokenService_1.signAccessToken)({ userId: idString, role: user.role });
    const refreshToken = (0, tokenService_1.signRefreshToken)({ userId: idString, });
    // parse the expiry strings from config
    const accessMaxAge = (0, tokenService_1.parseExpiryToMs)(index_1.default.jwt_access_token_expires_in);
    const refreshMaxAge = (0, tokenService_1.parseExpiryToMs)(index_1.default.jwt_refresh_token_expires_in);
    // set the cookies
    res.cookie("accessToken", accessToken, (0, tokenService_1.cookieOptions)(accessMaxAge));
    res.cookie("refreshToken", refreshToken, (0, tokenService_1.cookieOptions)(refreshMaxAge));
    const userResponse = (0, RemovePasswordFromUserObjectProcessor_1.sanitizeUser)(user);
    (0, ResponseHelpers_1.sendResponse)(res, { user: userResponse }, "Login successful");
});
exports.loginUser = loginUser;
const getCurrentUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // req.user is set by authenticateJwt
    const payload = req.user;
    if (!payload) {
        return next(new ErrorHandler_1.default("Not authenticated", 401));
    }
    const user = yield UserModel_1.default.findById(payload.userId);
    if (!user || user.isDeleted) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    const userResponse = (0, RemovePasswordFromUserObjectProcessor_1.sanitizeUser)(user);
    (0, ResponseHelpers_1.sendResponse)(res, { user: userResponse }, "Current user retrieved", 200);
});
exports.getCurrentUser = getCurrentUser;
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return next(new ErrorHandler_1.default("Email is required", 400));
    }
    const user = yield UserModel_1.default.findOne({ email });
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Check if the account is deleted or inactive
    if (user.isDeleted) {
        return next(new ErrorHandler_1.default("This account has been deleted", 403));
    }
    if (user.status !== "Active") {
        return next(new ErrorHandler_1.default("Account is not active", 403));
    }
    // Generate a reset token valid for 1 hour
    const token = jsonwebtoken_1.default.sign({ userId: user._id }, index_1.default.jwt_secret, {
        expiresIn: "1h",
    });
    // Use the provided email template function and modify it for a reset-password email
    const emailHtml = (0, emailTemplates_1.resetPasswordEmailTemplate)(user.firstName, token);
    // Send the reset email
    yield (0, SendVerifyAccountEmailProcessor_1.sendEmail)({
        to: user.email,
        subject: "Password Reset Instructions",
        html: emailHtml,
    });
    (0, ResponseHelpers_1.sendResponse)(res, null, "Password reset instructions sent to your email", 200);
});
exports.forgotPassword = forgotPassword;
const changePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
        return next(new ErrorHandler_1.default("User id, old password, and new password are required", 400));
    }
    const user = yield UserModel_1.default.findById(userId);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Additional checks for account status and deletion
    if (user.isDeleted) {
        return next(new ErrorHandler_1.default("This account has been deleted", 403));
    }
    if (user.status !== "Active") {
        return next(new ErrorHandler_1.default("Account is not active", 403));
    }
    const isMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isMatch) {
        return next(new ErrorHandler_1.default("Old password is incorrect", 401));
    }
    if (!(0, IsStrongPasswordProcessor_1.isStrongPassword)(newPassword)) {
        return next(new ErrorHandler_1.default("Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.", 400));
    }
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
    user.password = hashedPassword;
    yield user.save();
    (0, ResponseHelpers_1.sendResponse)(res, null, "Password changed successfully", 200);
});
exports.changePassword = changePassword;
const verifyEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
        return next(new ErrorHandler_1.default("Verification token is required", 400));
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, index_1.default.jwt_secret);
    }
    catch (error) {
        return next(new ErrorHandler_1.default("Invalid or expired token", 400));
    }
    const user = yield UserModel_1.default.findById(decoded.userId);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    user.isEmailVerified = true;
    yield user.save();
    (0, ResponseHelpers_1.sendResponse)(res, null, "Email verified successfully", 200);
});
exports.verifyEmail = verifyEmail;
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return next(new ErrorHandler_1.default("Token and new password are required", 400));
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, index_1.default.jwt_secret);
    }
    catch (error) {
        return next(new ErrorHandler_1.default("Invalid or expired token", 400));
    }
    const user = yield UserModel_1.default.findById(decoded.userId);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    if (!(0, IsStrongPasswordProcessor_1.isStrongPassword)(newPassword)) {
        return next(new ErrorHandler_1.default("Password must be at least 9 characters long and include uppercase, lowercase, number, and special character.", 400));
    }
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
    user.password = hashedPassword;
    yield user.save();
    (0, ResponseHelpers_1.sendResponse)(res, null, "Password reset successful", 200);
});
exports.resetPassword = resetPassword;
const editUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, companyName } = req.body;
    // Find the user by id
    const user = yield UserModel_1.default.findById(id);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Update only the allowed fields if provided
    if (firstName !== undefined)
        user.firstName = firstName;
    if (lastName !== undefined)
        user.lastName = lastName;
    if (phoneNumber !== undefined)
        user.phoneNumber = phoneNumber;
    if (companyName !== undefined)
        user.companyName = companyName;
    // Save the updated user document
    const updatedUser = yield user.save();
    // Sanitize and send the updated user response
    const userResponse = (0, RemovePasswordFromUserObjectProcessor_1.sanitizeUser)(updatedUser);
    (0, ResponseHelpers_1.sendResponse)(res, userResponse, "User updated successfully");
});
exports.editUser = editUser;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract user id from route parameters.
    const { id } = req.params;
    // Check if the user exists.
    const user = yield UserModel_1.default.findById(id);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // Fixed default user id to be used as replacement for project createdBy field.
    const defaultUserId = "67f35a519c899e0dc4b6dee5";
    // Update all projects where this user is the creator.
    yield ProjectModel_1.default.updateMany({ createdBy: user._id }, { $set: { createdBy: defaultUserId } });
    // Instead of deleting the user, update the isDeleted field to true.
    user.isDeleted = true;
    yield user.save();
    // Send a success response.
    (0, ResponseHelpers_1.sendResponse)(res, null, "User deleted successfully", 200);
});
exports.deleteUser = deleteUser;
const findUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = (req.query._id || req.query.id);
    if (!userId) {
        return next(new ErrorHandler_1.default("User ID is required", 400));
    }
    const user = yield UserModel_1.default.findById(userId);
    if (!user || user.isDeleted) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    (0, ResponseHelpers_1.sendResponse)(res, user, "User retrieved successfully", 200);
});
exports.findUserById = findUserById;
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.refreshToken;
    if (!token) {
        return next(new ErrorHandler_1.default("No refresh token", 401));
    }
    const { userId } = (0, tokenService_1.verifyRefreshToken)(token);
    const user = yield UserModel_1.default.findById(userId);
    if (!user) {
        return next(new ErrorHandler_1.default("User not found", 404));
    }
    // sign a fresh access token
    const newAccessToken = (0, tokenService_1.signAccessToken)({
        userId,
        role: user.role,
    });
    // convert your expiry‐string to a number
    const accessMaxAge = (0, tokenService_1.parseExpiryToMs)(index_1.default.jwt_access_token_expires_in);
    // set the cookie
    res.cookie("accessToken", newAccessToken, (0, tokenService_1.cookieOptions)(accessMaxAge));
    (0, ResponseHelpers_1.sendResponse)(res, null, "Access token refreshed", 200);
});
exports.refreshToken = refreshToken;
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    (0, ResponseHelpers_1.sendResponse)(res, null, "Logged out successfully", 200);
});
exports.logoutUser = logoutUser;
