import { Document, Model } from "mongoose";
import { IGroupMessage } from "../../shared/interface/GroupMessageInterface";
interface IGroupMessageDoc extends Omit<IGroupMessage, "_id">, Document {
}
export declare const GroupMessageModel: Model<IGroupMessageDoc>;
export default GroupMessageModel;
//# sourceMappingURL=GroupMessage.d.ts.map