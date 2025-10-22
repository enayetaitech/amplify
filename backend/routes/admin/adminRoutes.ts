import express from "express";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { Roles } from "../../constants/roles";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import {
  adminCreateUser,
  adminListUsers,
  adminEditUser,
  adminUpdateStatus,
  adminResendInvite,
  listExternalAdmins,
  transferExternalAdminProjects,
  deleteExternalAdmin,
} from "../../controllers/AdminUserController";

const router = express.Router();

// RBAC: SuperAdmin and AmplifyAdmin for general admin operations
router.use(
  authenticateJwt,
  authorizeRoles(Roles.SuperAdmin, Roles.AmplifyAdmin)
);

router.post("/users", catchError(adminCreateUser));
router.get("/users", catchError(adminListUsers));
router.patch("/users/:id", catchError(adminEditUser));
router.patch("/users/:id/status", catchError(adminUpdateStatus));
router.post("/users/:id/resend-invite", catchError(adminResendInvite));

// External Admin management — SuperAdmin only routes
router.get(
  "/external-admins",
  authorizeRoles(Roles.SuperAdmin, Roles.AmplifyAdmin),
  catchError(listExternalAdmins)
);
router.post(
  "/external-admins/transfer-projects",
  authorizeRoles(Roles.SuperAdmin),
  catchError(transferExternalAdminProjects)
);
router.delete(
  "/external-admins/:id",
  authorizeRoles(Roles.SuperAdmin),
  catchError(deleteExternalAdmin)
);

export default router;
