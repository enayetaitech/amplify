import { Document, Model, Types } from "mongoose";
import { IWaitingRoomChat } from "../../shared/interface/WaitingRoomChatInterface";
interface IObserverWaitingRoomChatDocument extends Omit<IWaitingRoomChat, "sessionId" | "_id">, Document {
    sessionId: Types.ObjectId;
}
export declare const ObserverWaitingRoomChatModel: Model<IObserverWaitingRoomChatDocument>;
export {};
//# sourceMappingURL=ObserverWaitingRoomChatModel.d.ts.map