"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/nodemailer.config.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_1 = __importDefault(require("./index"));
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: index_1.default.SMTP_USER,
        pass: index_1.default.SMTP_PASS,
    },
});
exports.default = transporter;
