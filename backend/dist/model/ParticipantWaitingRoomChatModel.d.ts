import { Document, Model, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";
export interface IParticipantWaitingRoomChatDocument extends Omit<IWaitingRoomChat, "sessionId" | "_id">, Document {
    sessionId: Types.ObjectId;
}
export declare const ParticipantWaitingRoomChatModel: Model<IParticipantWaitingRoomChatDocument>;
//# sourceMappingURL=ParticipantWaitingRoomChatModel.d.ts.map