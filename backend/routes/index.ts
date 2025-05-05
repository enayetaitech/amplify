// src/routes/index.ts
import express from "express";
import userRoutes from "./user/userRoutes";
import projectRoutes from "./project/projectRoutes";
import paymentRoutes from "./payment/PaymentRoutes";
import moderatorRoutes from "./moderator/ModeratorRoutes";
import sessionRoutes from "./session/SessionRoutes"
import tagRoutes from "./tag/TagRoutes"
import sessionDeliverableRoutes from "./sessionDeliverable/SessionDeliverableRoutes"
import observerDocumentRoutes from "./observerDocument/ObserverDocumentRoutes"


const router = express.Router();

// Define all your routes here
const routes: { path: string; route: express.Router }[] = [
  { path: "/users", route: userRoutes },
  { path: "/projects", route: projectRoutes },
  { path: "/payment", route: paymentRoutes },
  { path: "/moderators", route: moderatorRoutes },
  { path: "/sessions", route: sessionRoutes },
  { path: "/tags", route: tagRoutes },
  { path: "/sessionDeliverables", route: sessionDeliverableRoutes },
  { path: "/observerDocuments", route: observerDocumentRoutes },
];

// Loop through and mount each route
routes.forEach((r) => {
  router.use(r.path, r.route);
});

export default router;
