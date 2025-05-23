import { Document, Model } from "mongoose";
import { IObserverGroupMessage } from "../../shared/interface/ObserverGroupMessageInterface";
interface IObserverGroupMessageDoc extends Omit<IObserverGroupMessage, "_id">, Document {
}
export declare const ObserverGroupMessageModel: Model<IObserverGroupMessageDoc>;
export default ObserverGroupMessageModel;
//# sourceMappingURL=ObserverGroupMessage.d.ts.map