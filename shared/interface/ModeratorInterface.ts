export interface IModerator {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  adminAccess: boolean;
  projectId: string;
  isVerified: boolean;
}