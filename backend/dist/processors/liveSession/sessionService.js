"use strict";
// backend/processors/sessionService.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLiveSession = createLiveSession;
exports.enqueueUser = enqueueUser;
exports.startSession = startSession;
exports.endSession = endSession;
exports.getSessionHistory = getSessionHistory;
exports.logLeave = logLeave;
const mongoose_1 = require("mongoose");
const LiveSessionModel_1 = require("../../model/LiveSessionModel");
const UserActivityModel_1 = require("../../model/UserActivityModel");
const ChatModel_1 = __importDefault(require("../../model/ChatModel"));
const GroupMessage_1 = __importDefault(require("../../model/GroupMessage"));
const ObserverGroupMessage_1 = __importDefault(require("../../model/ObserverGroupMessage"));
const ParticipantWaitingRoomChatModel_1 = require("../../model/ParticipantWaitingRoomChatModel");
/**
 * Ensure there is a LiveSession for the given scheduled session.
 * If none exists, create it with ongoing=false.
 */
function createLiveSession(sessionId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // include the session on the query (so even findOne is under txn)
        const live = yield LiveSessionModel_1.LiveSessionModel.findOne({ sessionId: new mongoose_1.Types.ObjectId(sessionId) }, null, { session: options === null || options === void 0 ? void 0 : options.session });
        if (live)
            return live;
        // create with the session option
        const [created] = yield LiveSessionModel_1.LiveSessionModel.create([
            {
                sessionId: new mongoose_1.Types.ObjectId(sessionId),
                ongoing: false,
            }
        ], { session: options === null || options === void 0 ? void 0 : options.session });
        return created;
    });
}
/**
 * Add a user to the waiting room and record their join in UserActivity.
 */
function enqueueUser(sessionId, userData) {
    return __awaiter(this, void 0, void 0, function* () {
        const live = yield LiveSessionModel_1.LiveSessionModel.findOne({ sessionId });
        if (!live)
            throw new Error("LiveSession not found");
        // 🛑 skip if already in waiting room
        if (userData.role === "Participant" && (live.participantWaitingRoom.some((u) => u.email === userData.email) ||
            live.participantsList.some((u) => u.email === userData.email))) {
            return {
                participantsWaitingRoom: live.participantWaitingRoom,
                observersWaitingRoom: live.observerWaitingRoom,
                participantList: live.participantsList,
                observerList: live.observerList
            };
        }
        // Add to waiting room
        if (userData.role === "Participant") {
            live.participantWaitingRoom.push({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                joinedAt: new Date(),
            });
        }
        else if (userData.role === "Observer") {
            live.observerWaitingRoom.push({
                userId: userData.userId || undefined,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                joinedAt: new Date(),
            });
        }
        else if (userData.role === "Moderator" || userData.role === "Admin") {
            const email = userData.email;
            if (live.observerList.some(u => u.email === email) ||
                live.participantsList.some(u => u.email === email)) {
                return {
                    participantsWaitingRoom: live.participantWaitingRoom,
                    observersWaitingRoom: live.observerWaitingRoom,
                    participantList: live.participantsList,
                    observerList: live.observerList,
                };
            }
            live.observerList.push({
                userId: userData.userId || undefined,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                joinedAt: new Date(),
            });
            live.participantsList.push({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                joinedAt: new Date(),
            });
        }
        yield live.save();
        // Log join in activity
        yield UserActivityModel_1.UserActivityModel.create({
            sessionId: live._id,
            userId: userData.userId ? new mongoose_1.Types.ObjectId(userData.userId) : undefined,
            role: userData.role,
            joinTime: new Date(),
        });
        return {
            participantsWaitingRoom: live.participantWaitingRoom,
            observersWaitingRoom: live.observerWaitingRoom,
            participantList: live.participantsList,
            observerList: live.observerList
        };
    });
}
/**
 * Mark the LiveSession as started.
 */
function startSession(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const live = yield LiveSessionModel_1.LiveSessionModel.findOne({ sessionId });
        if (!live)
            throw new Error("LiveSession not found");
        live.ongoing = true;
        live.startTime = new Date();
        yield live.save();
        return live;
    });
}
/**
 * Mark the LiveSession as ended and record endTime.
 */
function endSession(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const live = yield LiveSessionModel_1.LiveSessionModel.findOne({ sessionId });
        if (!live)
            throw new Error("LiveSession not found");
        live.ongoing = false;
        live.endTime = new Date();
        yield live.save();
        return live;
    });
}
/**
 * Fetch consolidated session history:
 *  • liveSession metadata
 *  • all join/leave activities
 *  • all waiting-room chats
 *  • all in-meeting direct and group chats
 */
function getSessionHistory(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const live = yield LiveSessionModel_1.LiveSessionModel.findOne({ sessionId });
        if (!live)
            throw new Error("LiveSession not found");
        const liveId = live._id;
        // Join/leave activity
        const activities = yield UserActivityModel_1.UserActivityModel.find({ sessionId: liveId }).lean();
        // Waiting-room chats
        const waitingRoomChats = yield ParticipantWaitingRoomChatModel_1.ParticipantWaitingRoomChatModel.find({
            sessionId: liveId,
        }).lean();
        // In-meeting direct chats (1:1)
        const directChats = yield ChatModel_1.default.find({
            sessionId: liveId,
        }).lean();
        // In-meeting participant group chats
        const groupChats = yield GroupMessage_1.default.find({
            meetingId: sessionId,
        }).lean();
        // In-meeting observer group chats
        const observerChats = yield ObserverGroupMessage_1.default.find({
            meetingId: sessionId,
        }).lean();
        return {
            liveSession: live.toObject(),
            activities,
            waitingRoomChats,
            directChats,
            groupChats,
            observerChats,
        };
    });
}
function logLeave(sessionId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Find the LiveSession to get its _id
        const live = yield LiveSessionModel_1.LiveSessionModel.findOne({ sessionId });
        if (!live)
            throw new Error("LiveSession not found");
        // Find the most recent activity without a leaveTime
        const activity = yield UserActivityModel_1.UserActivityModel.findOne({
            sessionId: live._id,
            userId: new mongoose_1.Types.ObjectId(userId),
            leaveTime: { $exists: false },
        }).sort({ joinTime: -1 });
        if (activity) {
            activity.leaveTime = new Date();
            yield activity.save();
        }
    });
}
