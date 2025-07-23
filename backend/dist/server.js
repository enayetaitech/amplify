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
// src/server.ts
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./config/index"));
const db_1 = __importDefault(require("./config/db"));
const ErrorMiddleware_1 = __importDefault(require("./middlewares/ErrorMiddleware"));
const index_2 = __importDefault(require("./routes/index"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const deviceInfo_1 = require("./middlewares/deviceInfo");
const http_1 = __importDefault(require("http"));
const socket_1 = require("./socket");
const app = (0, express_1.default)();
console.log("Starting server...", index_1.default.frontend_base_url);
// ✅ CORS config
const allowedOrigins = [index_1.default.frontend_base_url, "http://localhost:3000",];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// Middleware to parse JSON bodies
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.set('trust proxy', true);
// this must come before any route that needs deviceInfo
app.use(deviceInfo_1.deviceInfoMiddleware);
// Example route
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    // console.log('Body:', req.body);
    next();
});
// Place your other routes here
app.use("/api/v1", index_2.default);
// Error handling middleware should be added after routes
app.use(ErrorMiddleware_1.default);
// Create an HTTP server from Express
const server = http_1.default.createServer(app);
// Initialize Socket.IO on that server
(0, socket_1.initSocket)(server);
// Connect to the database and start the server
const PORT = index_1.default.port || 8008;
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.default)();
    console.log(`Server is running on port ${PORT}`);
}));
