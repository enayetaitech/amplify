import { Types, Document } from "mongoose";
import { IPoll } from "../../shared/interface/PollInterface";
type PollDB = Omit<IPoll, "_id" | "projectId" | "sessionId" | "createdBy" | "questions"> & {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
    sessionId: Types.ObjectId;
    createdBy: Types.ObjectId;
    questions: (IPoll["questions"][number] & {
        _id: Types.ObjectId;
    })[];
};
export interface PollDocument extends Document<Types.ObjectId, {}, PollDB>, PollDB {
}
export declare const PollModel: import("mongoose").Model<PollDocument, {}, {}, {}, Document<unknown, {}, PollDocument> & PollDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=PollModel.d.ts.map