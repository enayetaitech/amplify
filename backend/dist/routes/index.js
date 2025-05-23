"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/index.ts
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("./user/userRoutes"));
const projectRoutes_1 = __importDefault(require("./project/projectRoutes"));
const PaymentRoutes_1 = __importDefault(require("./payment/PaymentRoutes"));
const ModeratorRoutes_1 = __importDefault(require("./moderator/ModeratorRoutes"));
const SessionRoutes_1 = __importDefault(require("./session/SessionRoutes"));
const TagRoutes_1 = __importDefault(require("./tag/TagRoutes"));
const SessionDeliverableRoutes_1 = __importDefault(require("./sessionDeliverable/SessionDeliverableRoutes"));
const ObserverDocumentRoutes_1 = __importDefault(require("./observerDocument/ObserverDocumentRoutes"));
const PollRoutes_1 = __importDefault(require("./poll/PollRoutes"));
const LiveSessionRoutes_1 = __importDefault(require("./liveSession/LiveSessionRoutes"));
const router = express_1.default.Router();
// Define all your routes here
const routes = [
    { path: "/users", route: userRoutes_1.default },
    { path: "/projects", route: projectRoutes_1.default },
    { path: "/payment", route: PaymentRoutes_1.default },
    { path: "/moderators", route: ModeratorRoutes_1.default },
    { path: "/sessions", route: SessionRoutes_1.default },
    { path: "/tags", route: TagRoutes_1.default },
    { path: "/sessionDeliverables", route: SessionDeliverableRoutes_1.default },
    { path: "/observerDocuments", route: ObserverDocumentRoutes_1.default },
    { path: "/polls", route: PollRoutes_1.default },
    { path: "/liveSessions", route: LiveSessionRoutes_1.default },
];
// Loop through and mount each route
routes.forEach((r) => {
    router.use(r.path, r.route);
});
exports.default = router;
