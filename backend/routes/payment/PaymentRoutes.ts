import express from "express";
import { catchError } from "../../middlewares/catchError.middleware";
import {
  createCustomer,
  createPaymentIntent,
  savePaymentMethod,
  createSetupIntent,
  retrievePaymentMethod,
  chargeCustomer,
  saveBillingInfo
} from "../../controllers/PaymentController";

const router = express.Router();

// POST /api/v1/payment/create-customer
router.post("/create-customer", catchError(createCustomer));

// POST /api/v1/payment/create-payment-intent
router.post("/create-payment-intent", catchError(createPaymentIntent));

// POST /api/v1/payment/save-payment-method
router.post("/save-payment-method", catchError(savePaymentMethod));

// POST /api/v1/payment/create-setup-intent
router.post("/create-setup-intent", catchError(createSetupIntent));

// POST /api/v1/payment/retrieve-payment-method
router.post("/retrieve-payment-method", catchError(retrievePaymentMethod));

// POST /api/v1/payment/charge
router.post("/charge", catchError(chargeCustomer));

// POST /api/v1/payment/save-billing-info
router.post("/save-billing-info", catchError(saveBillingInfo));

export default router;
