"use strict";
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
exports.sendEmail = void 0;
const NodemailerConfig_1 = __importDefault(require("../../config/NodemailerConfig"));
const index_1 = __importDefault(require("../../config/index"));
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: index_1.default.EMAIL_FROM || 'test356sales@gmail.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
    };
    yield NodemailerConfig_1.default.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        }
        else {
            console.log("Email has been sent:", info);
        }
    });
});
exports.sendEmail = sendEmail;
