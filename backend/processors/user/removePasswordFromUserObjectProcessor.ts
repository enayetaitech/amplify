import { IUserDocument } from "../../model/UserModel";


export const sanitizeUser = (user: IUserDocument) => {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    companyName: user.companyName,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    termsAccepted: user.termsAccepted,
    termsAcceptedTime: user.termsAcceptedTime,
    isDeleted: user.isDeleted,
    createdBy: user.createdBy,
    createdById: user.createdById,
    credits: user.credits,
    stripeCustomerId: user.stripeCustomerId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
