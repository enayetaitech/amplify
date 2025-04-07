// src/routes/index.ts
import express from "express";
import userRoutes from "./user/userRoutes";
import projectRoutes from "./project/projectRoutes";
// import more routes as you create them...

const router = express.Router();

// Define all your routes here
const routes: { path: string; route: express.Router }[] = [
  { path: "/users", route: userRoutes },
  { path: "/projects", route: projectRoutes },

];

// Loop through and mount each route
routes.forEach((r) => {
  router.use(r.path, r.route);
});

export default router;
