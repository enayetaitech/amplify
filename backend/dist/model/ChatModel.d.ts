import { Document, Model } from "mongoose";
import { IChatMessage } from "../../shared/interface/ChatMessageInterface";
interface IChatMessageDoc extends Omit<IChatMessage, "_id">, Document {
}
export declare const ChatMessageModel: Model<IChatMessageDoc>;
export default ChatMessageModel;
//# sourceMappingURL=ChatModel.d.ts.map