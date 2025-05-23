import { Request, Response, NextFunction } from "express";
/**
 * Create or update a Stripe customer.
 * Expects `userId` and (optionally) `billingInfo` (conforming to IBillingInfo)
 * in req.body.
 */
export declare const createCustomer: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create a PaymentIntent for a charge.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
export declare const createPaymentIntent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Save a payment method: attach the provided paymentMethodId to the customer,
 * update it as the default payment method, and update the user document
 * with card information.
 *
 * Expects `customerId` and `paymentMethodId` in req.body.
 */
export declare const savePaymentMethod: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create a SetupIntent for saving/updating card information.
 * This endpoint expects an authenticated user (req.userId set via auth middleware).
 */
export declare const createSetupIntent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Retrieve a PaymentMethod by its ID.
 * Expects `paymentMethodId` in req.body.
 */
export declare const retrievePaymentMethod: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Charge the customer using the saved default payment method.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
export declare const chargeCustomer: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const saveBillingInfo: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=PaymentController.d.ts.map