"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../../controllers/UserController");
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const authenticateJwt_1 = require("../../middlewares/authenticateJwt");
const router = express_1.default.Router();
// POST /api/v1/users/register - Register a new user
router.post('/register', (0, CatchErrorMiddleware_1.catchError)(UserController_1.createAccount));
// POST /api/v1/users/login - login a user
router.post('/login', (0, CatchErrorMiddleware_1.catchError)(UserController_1.loginUser));
// POST /api/v1/users/logout - logout a user
router.post('/logout', (0, CatchErrorMiddleware_1.catchError)(UserController_1.logoutUser));
// POST /api/v1/users/refreshToken - 
router.post('/refreshToken', (0, CatchErrorMiddleware_1.catchError)(UserController_1.refreshToken));
// POST /api/v1/auth/forgot-password
router.post('/forgot-password', (0, CatchErrorMiddleware_1.catchError)(UserController_1.forgotPassword));
// POST /api/v1/auth/reset-password
router.post('/reset-password', (0, CatchErrorMiddleware_1.catchError)(UserController_1.resetPassword));
// GET /api/v1/auth/verify-email
router.get('/verify-email', (0, CatchErrorMiddleware_1.catchError)(UserController_1.verifyEmail));
// GET /api/v1/auth/find-by-id
router.get('/find-by-id', (0, CatchErrorMiddleware_1.catchError)(UserController_1.findUserById));
// POST /api/v1/auth/change-password
router.post('/change-password', (0, CatchErrorMiddleware_1.catchError)(UserController_1.changePassword));
// PUT /api/v1/auth/edit/:id
router.put('/edit/:id', (0, CatchErrorMiddleware_1.catchError)(UserController_1.editUser));
// DELETE /api/v1/auth/:id
router.delete('/:id', (0, CatchErrorMiddleware_1.catchError)(UserController_1.deleteUser));
router.get("/me", authenticateJwt_1.authenticateJwt, (0, CatchErrorMiddleware_1.catchError)(UserController_1.getCurrentUser));
// ! Delete route will be implemented after creating project
// ! Find all and find by id route need to be implemented for the amplify admin
exports.default = router;
