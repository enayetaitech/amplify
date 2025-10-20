import express, { RequestHandler } from "express";
import { catchError } from "../../middlewares/CatchErrorMiddleware";
import { authenticateJwt } from "../../middlewares/authenticateJwt";
import {
  createCustomer,
  createPaymentIntent,
  savePaymentMethod,
  createSetupIntent,
  retrievePaymentMethod,
  chargeCustomer,
  saveBillingInfo,
  listPaymentMethods,
  detachPaymentMethod,
  setDefaultPaymentMethod,
  listPurchases,
  getUsageSummary,
  stripeWebhookHandler,
} from "../../controllers/PaymentController";

const router = express.Router();

// POST /api/v1/payment/create-customer
router.post("/create-customer", authenticateJwt, catchError(createCustomer));

// POST /api/v1/payment/create-payment-intent
router.post(
  "/create-payment-intent",
  authenticateJwt,
  catchError(createPaymentIntent)
);

// POST /api/v1/payment/save-payment-method
router.post(
  "/save-payment-method",
  authenticateJwt,
  catchError(savePaymentMethod)
);

// POST /api/v1/payment/create-setup-intent
router.post(
  "/create-setup-intent",
  authenticateJwt,
  catchError(createSetupIntent)
);

// POST /api/v1/payment/retrieve-payment-method
router.post(
  "/retrieve-payment-method",
  authenticateJwt,
  catchError(retrievePaymentMethod)
);

// POST /api/v1/payment/charge (idempotent via key)
router.post("/charge", authenticateJwt, catchError(chargeCustomer));

// POST /api/v1/payment/save-billing-info
router.post("/save-billing-info", authenticateJwt, catchError(saveBillingInfo));

// GET /api/v1/payment/methods - list saved card payment methods
router.get("/methods", authenticateJwt, catchError(listPaymentMethods));

// POST /api/v1/payment/detach - detach a payment method
router.post("/detach", authenticateJwt, catchError(detachPaymentMethod));

// POST /api/v1/payment/set-default - set a default payment method
router.post(
  "/set-default",
  authenticateJwt,
  catchError(setDefaultPaymentMethod)
);

// GET /api/v1/payment/purchases - list credit purchases
router.get("/purchases", authenticateJwt, catchError(listPurchases));

// GET /api/v1/payment/usage - usage summary and recent items
router.get("/usage", authenticateJwt, catchError(getUsageSummary));

// POST /api/v1/payment/webhook - Stripe webhook (no auth; raw body required)
const stripeRawBody: RequestHandler = express.raw({
  type: "application/json",
}) as unknown as RequestHandler;
router.post("/webhook", stripeRawBody, stripeWebhookHandler);

export default router;
