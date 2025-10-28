import express from "express";
import {
  createAccount,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  editUser,
  deleteUser,
  findUserById,
  refreshToken,
  logoutUser,
  getCurrentUser,
  requestEmailChange,
  verifyEmailChange,
} from "../../controllers/UserController";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { authenticateJwt } from "../../middlewares/authenticateJwt";

const router = express.Router();

// POST /api/v1/users/register - Register a new user
router.post("/register", catchError(createAccount));
// POST /api/v1/users/login - login a user
router.post("/login", catchError(loginUser));

// POST /api/v1/users/logout - logout a user
router.post("/logout", catchError(logoutUser));

// POST /api/v1/users/refreshToken -
router.post("/refreshToken", catchError(refreshToken));

// POST /api/v1/users/forgot-password
router.post("/forgot-password", catchError(forgotPassword));

// POST /api/v1/users/reset-password
router.post("/reset-password", catchError(resetPassword));

// GET /api/v1/users/verify-email
router.get("/verify-email", catchError(verifyEmail));

// GET /api/v1/users/find-by-id
router.get("/find-by-id", catchError(findUserById));

// POST /api/v1/users/change-password
router.post("/change-password", catchError(changePassword));

// PUT /api/v1/users/edit/:id
router.put("/edit/:id", catchError(editUser));

// POST /api/v1/users/:id/request-email-change - Request email change with verification
router.post(
  "/:id/request-email-change",
  authenticateJwt,
  catchError(requestEmailChange)
);

// POST /api/v1/users/:id/verify-email-change - Verify email change code
router.post(
  "/:id/verify-email-change",
  authenticateJwt,
  catchError(verifyEmailChange)
);

// DELETE /api/v1/users/:id
router.delete("/:id", catchError(deleteUser));

router.get("/me", authenticateJwt, catchError(getCurrentUser));
// ! Delete route will be implemented after creating project
// ! Find all and find by id route need to be implemented for the amplify admin

export default router;
