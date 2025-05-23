import mongoose, { Document, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";
export interface ParticipantMeetingChatDocument extends Omit<IWaitingRoomChat, "sessionId" | "_id">, Document {
    sessionId: Types.ObjectId;
}
export declare const ParticipantMeetingChatModel: mongoose.Model<ParticipantMeetingChatDocument, {}, {}, {}, mongoose.Document<unknown, {}, ParticipantMeetingChatDocument> & ParticipantMeetingChatDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ParticipantMeetingChatModel.d.ts.map