export interface IBillingInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ICreditCardInfo {
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  password: string;
  role:
    | "Admin"
    | "Moderator"
    | "Observer"
    | "Participant"
    | "SuperAdmin"
    | "AmplifyAdmin"
    | "AmplifyModerator"
    | "AmplifyObserver"
    | "AmplifyParticipant"
    | "AmplifyTechHost";
  status: string;
  isEmailVerified: boolean;
  termsAccepted: boolean;
  termsAcceptedTime: Date;
  isDeleted: boolean;
  createdBy?: string;
  createdById?: string;
  credits: number;
  stripeCustomerId?: string;
  billingInfo?: IBillingInfo;
  creditCardInfo?: ICreditCardInfo;
  // Email change verification fields
  pendingEmail?: string;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EditUser {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  companyName: string;
  role?: string;
  [key: string]: any;
}
