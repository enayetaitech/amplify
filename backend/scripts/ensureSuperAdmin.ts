import bcrypt from "bcrypt";
import User from "../model/UserModel";
import { Roles } from "../constants/roles";

/**
 * Ensures there is at least one SuperAdmin.
 * If none exists, creates a default SuperAdmin using the provided seed values.
 * Email: enayetflweb@gmail.com, Password: Ab123456@
 */
export async function ensureSuperAdmin(): Promise<void> {
  const existing = await User.findOne({ role: Roles.SuperAdmin }).lean();
  if (existing) return;

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash("Ab123456@", saltRounds);

  await User.create({
    firstName: "Super",
    lastName: "Admin",
    email: "enayetflweb@gmail.com",
    phoneNumber: "0000000000",
    companyName: "Amplify",
    password: passwordHash,
    role: Roles.SuperAdmin,
    status: "Active",
    isEmailVerified: true,
    termsAccepted: true,
    termsAcceptedTime: new Date(),
    isDeleted: false,
    createdBy: "seed",
  });
}
