export type Role = "Admin" | "Moderator" | "Observer";
export interface IModerator {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    adminAccess: boolean;
    roles: Role[];
    projectId: string;
    isVerified: boolean;
    isActive: boolean;
}
//# sourceMappingURL=ModeratorInterface.d.ts.map