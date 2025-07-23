"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionHistory = exports.endSession = exports.startSession = void 0;
const ResponseHelpers_1 = require("../utils/ResponseHelpers");
const sessionService = __importStar(require("../processors/liveSession/sessionService"));
const startSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    const live = yield sessionService.startSession(sessionId);
    (0, ResponseHelpers_1.sendResponse)(res, live, "Meeting started", 200);
});
exports.startSession = startSession;
const endSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    const live = yield sessionService.endSession(sessionId);
    (0, ResponseHelpers_1.sendResponse)(res, { sessionId: live.sessionId }, "Meeting ended", 200);
});
exports.endSession = endSession;
const getSessionHistory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    const history = yield sessionService.getSessionHistory(sessionId);
    (0, ResponseHelpers_1.sendResponse)(res, history, "Session history retrieved", 200);
});
exports.getSessionHistory = getSessionHistory;
