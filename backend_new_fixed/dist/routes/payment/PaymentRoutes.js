"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CatchErrorMiddleware_1 = require("../../middlewares/CatchErrorMiddleware");
const PaymentController_1 = require("../../controllers/PaymentController");
const router = express_1.default.Router();
// POST /api/v1/payment/create-customer
router.post("/create-customer", (0, CatchErrorMiddleware_1.catchError)(PaymentController_1.createCustomer));
// POST /api/v1/payment/create-payment-intent
router.post("/create-payment-intent", (0, CatchErrorMiddleware_1.catchError)(PaymentController_1.createPaymentIntent));
// POST /api/v1/payment/save-payment-method
router.post("/save-payment-method", (0, CatchErrorMiddleware_1.catchError)(PaymentController_1.savePaymentMethod));
// POST /api/v1/payment/create-setup-intent
router.post("/create-setup-intent", (0, CatchErrorMiddleware_1.catchError)(PaymentController_1.createSetupIntent));
// POST /api/v1/payment/retrieve-payment-method
router.post("/retrieve-payment-method", (0, CatchErrorMiddleware_1.catchError)(PaymentController_1.retrievePaymentMethod));
// POST /api/v1/payment/charge
router.post("/charge", (0, CatchErrorMiddleware_1.catchError)(PaymentController_1.chargeCustomer));
// POST /api/v1/payment/save-billing-info
router.post("/save-billing-info", (0, CatchErrorMiddleware_1.catchError)(PaymentController_1.saveBillingInfo));
exports.default = router;
