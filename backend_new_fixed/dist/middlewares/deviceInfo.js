"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceInfoMiddleware = void 0;
const request_ip_1 = __importDefault(require("request-ip"));
const express_useragent_1 = __importDefault(require("express-useragent"));
const geoip_lite_1 = __importDefault(require("geoip-lite"));
exports.deviceInfoMiddleware = [
    // 1) populate `req.useragent`
    express_useragent_1.default.express(),
    // 2) our own middleware
    (req, res, next) => {
        var _a, _b, _c;
        // get the IP
        const ip = request_ip_1.default.getClientIp(req) || '';
        // unwrap the typed `req.useragent`
        const ua = req.useragent; // now TS knows this is `Details`
        const deviceType = ua.isMobile
            ? 'mobile'
            : ua.isDesktop
                ? 'desktop'
                : 'other';
        // typed lookup
        const geo = geoip_lite_1.default.lookup(ip);
        const location = {
            country: (_a = geo === null || geo === void 0 ? void 0 : geo.country) !== null && _a !== void 0 ? _a : null,
            region: (_b = geo === null || geo === void 0 ? void 0 : geo.region) !== null && _b !== void 0 ? _b : null,
            city: (_c = geo === null || geo === void 0 ? void 0 : geo.city) !== null && _c !== void 0 ? _c : null,
        };
        // attach a fully typed object
        req.deviceInfo = {
            ip,
            deviceType,
            platform: ua.platform,
            browser: ua.browser,
            location,
        };
        next();
    },
];
