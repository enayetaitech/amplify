// shared/interfaces/UserActivityInterface.ts
export interface IUserActivity {
  _id: string;
  sessionId: string; // ref to LiveSession._id
  userId?: string;
  email?: string;
  role: "Participant" | "Observer" | "Moderator" | "Admin";
  joinTime: Date;
  leaveTime?: Date;
  deviceInfo?: {
    ip: string;
    deviceType: string;
    platform: string;
    browser: string;
    location: string;
  };
}
