import { Document, Model, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";
interface IParticipantWaitingRoomChatDocument extends Omit<IWaitingRoomChat, "sessionId" | "_id">, Document {
    sessionId: Types.ObjectId;
}
export declare const ParticipantWaitingRoomChatModel: Model<IParticipantWaitingRoomChatDocument>;
export {};
//# sourceMappingURL=ParticipantWaitingRoomChatModel.d.ts.map