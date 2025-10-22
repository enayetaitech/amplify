import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import User from "../model/UserModel";
import { InviteModel } from "../model/Invite";
import { AuditLogModel } from "../model/AuditLog";
import config from "../config";
import { sendEmail } from "../processors/sendEmail/sendVerifyAccountEmailProcessor";
import { adminInviteEmailTemplate } from "../constants/emailTemplates";
import { Roles } from "../constants/roles";

export function canCreateRole(
  creatorRole: string,
  targetRole: string
): boolean {
  if (creatorRole === Roles.SuperAdmin) return true;
  if (creatorRole === Roles.AmplifyAdmin) {
    return [
      Roles.AmplifyModerator,
      Roles.AmplifyObserver,
      Roles.AmplifyParticipant,
      Roles.AmplifyTechHost,
      Roles.Moderator,
      Roles.Observer,
      Roles.Participant,
    ].includes(targetRole as Roles);
  }
  return false;
}

export async function createUserAndInvite(params: {
  actorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  role: string;
}) {
  const {
    actorId,
    firstName,
    lastName,
    email,
    phoneNumber,
    companyName,
    role,
  } = params;

  let user = await User.findOne({ email });
  if (!user) {
    // placeholder random password; user will reset via invite link
    const placeholder = "$INVITE$" + Math.random().toString(36).slice(2);
    user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      companyName,
      password: placeholder,
      role,
      status: "Active",
      isEmailVerified: false,
      termsAccepted: false,
      createdBy: "admin",
      createdById: new Types.ObjectId(actorId),
    });
  } else {
    // update role/company if different
    const update: Record<string, unknown> = {};
    if (user.role !== role) update.role = role;
    if (user.companyName !== companyName) update.companyName = companyName;
    if (Object.keys(update).length)
      await User.updateOne({ _id: user._id }, { $set: update });
  }

  const token = jwt.sign(
    { userId: String(user._id), email: user.email },
    config.jwt_secret as string,
    { expiresIn: "7d" }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await InviteModel.findOneAndUpdate(
    { email: user.email },
    {
      $set: {
        userId: user._id,
        role: role,
        companyName,
        token,
        expiresAt,
        status: "Pending",
        lastSentAt: new Date(),
      },
      $inc: { sendCount: 1 },
      $setOnInsert: { createdBy: new Types.ObjectId(actorId) },
    },
    { upsert: true }
  );

  const setPasswordUrl = `${
    config.frontend_base_url
  }/set-new-password?token=${encodeURIComponent(token)}`;
  const loginUrl = `${config.frontend_base_url}/login`;
  const html = adminInviteEmailTemplate({
    firstName,
    role,
    companyName,
    loginUrl,
    setPasswordUrl,
  });
  await sendEmail({ to: email, subject: "You're invited to Amplify", html });

  await AuditLogModel.create({
    actorId: new Types.ObjectId(actorId),
    action: "user.create",
    targetType: "User",
    targetId: new Types.ObjectId(String(user._id)),
    metadata: { role, companyName },
  });

  return user;
}

export async function resendInvite(actorId: string, userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  const token = jwt.sign(
    { userId: String(user._id), email: user.email },
    config.jwt_secret as string,
    { expiresIn: "7d" }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await InviteModel.findOneAndUpdate(
    { email: user.email },
    {
      $set: { token, expiresAt, lastSentAt: new Date(), status: "Pending" },
      $inc: { sendCount: 1 },
    },
    { upsert: true }
  );
  const html = adminInviteEmailTemplate({
    firstName: user.firstName,
    role: user.role,
    companyName: user.companyName,
    loginUrl: `${config.frontend_base_url}/login`,
    setPasswordUrl: `${
      config.frontend_base_url
    }/set-new-password?token=${encodeURIComponent(token)}`,
  });
  await sendEmail({ to: user.email, subject: "Your Amplify invite", html });
  await AuditLogModel.create({
    actorId: new Types.ObjectId(actorId),
    action: "user.resendInvite",
    targetType: "User",
    targetId: new Types.ObjectId(String(user._id)),
  });
}

export async function updateStatus(
  actorId: string,
  userId: string,
  status: "Active" | "Inactive"
) {
  await User.updateOne({ _id: userId }, { $set: { status } });
  await AuditLogModel.create({
    actorId: new Types.ObjectId(actorId),
    action: "user.status",
    targetType: "User",
    targetId: new Types.ObjectId(userId),
    metadata: { status },
  });
}
