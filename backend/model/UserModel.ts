import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "../../shared/interface/UserInterface";
export interface IUserDocument extends Omit<IUser, "_id">, Document {}

const UserSchema: Schema<IUserDocument> = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    companyName: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "Admin",
        "Moderator",
        "Observer",
        "Participant",
        "AmplifyAdmin",
        "AmplifyModerator",
        "AmplifyObserver",
        "AmplifyParticipant",
        "AmplifyTechHost",
      ],
      required: true,
    },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isEmailVerified: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, required: true },
    termsAcceptedTime: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: String, default: "self" },
    createdById: { type: Schema.Types.ObjectId },
    credits: { type: Number, default: 0 },
    stripeCustomerId: { type: String },
    billingInfo: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    creditCardInfo: {
      last4: { type: String },
      brand: { type: String },
      expiryMonth: { type: String },
      expiryYear: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> = mongoose.model<IUserDocument>(
  "User",
  UserSchema
);

export default User;
