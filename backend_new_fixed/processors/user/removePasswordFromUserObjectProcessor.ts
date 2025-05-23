import { IUserDocument } from "../../model/UserModel";

export const sanitizeUser = (user: IUserDocument) => {
  const { password, ...sanitizedUser } = user.toObject();
  return sanitizedUser;
};
