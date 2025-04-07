import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../model/UserModel';
import ErrorHandler from '../../shared/utils/ErrorHandler';
import { sendResponse } from '../utils/responseHelpers';
// import { sendEmail } from '../utils/email';
import { verificationEmailTemplate } from '../constants/emailTemplates';
import { sendEmail } from '../processors/sendEmail/sendVerifyAccountEmailProcessor';

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


  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler('User already exists', 400));
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
    status: status || 'Active',
    isEmailVerified: false,
    termsAccepted,
    termsAcceptedTime: new Date(),
    isDeleted: false,
    createdBy: 'self',
    credits: 0,
    stripeCustomerId: undefined,
  });

  const savedUser = await newUser.save();

  // Send verification email after account creation
  await sendEmail({
    to: savedUser.email,
    subject: 'Verify Your Account',
    html: verificationEmailTemplate(savedUser.firstName, String(savedUser._id)),
  });

  console.log('email send')

  const userResponse = {
    _id: savedUser._id,
    firstName: savedUser.firstName,
    lastName: savedUser.lastName,
    email: savedUser.email,
    phoneNumber: savedUser.phoneNumber,
    companyName: savedUser.companyName,
    role: savedUser.role,
    status: savedUser.status,
    isEmailVerified: savedUser.isEmailVerified,
    termsAccepted: savedUser.termsAccepted,
    termsAcceptedTime: savedUser.termsAcceptedTime,
    isDeleted: savedUser.isDeleted,
    createdBy: savedUser.createdBy,
    createdById: savedUser.createdById,
    credits: savedUser.credits,
    stripeCustomerId: savedUser.stripeCustomerId,
    createdAt: savedUser.createdAt,
    updatedAt: savedUser.updatedAt,
  };

  sendResponse(res, userResponse, 'User registered successfully', 201);
};
