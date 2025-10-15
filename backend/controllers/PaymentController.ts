import { Request, Response, NextFunction, RequestHandler } from "express";
import { sendResponse } from "../utils/responseHelpers";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import Stripe from "stripe";
import dotenv from "dotenv";
import { z } from "zod";
import {
  billingInfoSchema,
  chargeSchema,
  createCustomerSchema,
  createSetupIntentSchema,
  detachCardSchema,
  listCardsSchema,
  listPurchasesQuerySchema,
  retrievePaymentMethodSchema,
  saveBillingInfoSchema,
  savePaymentMethodSchema,
  setDefaultCardSchema,
  usageQuerySchema,
} from "../schemas/payment";
import CreditPurchase from "../model/CreditPurchase";
import LiveUsageLog from "../model/LiveUsageLog";
import Project from "../model/ProjectModel";
import { SessionModel as Session } from "../model/SessionModel";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Create or update a Stripe customer.
 * Expects `userId` and (optionally) `billingInfo` (conforming to IBillingInfo)
 * in req.body.
 */
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // prefer authenticated userId
  const authUserId = (req as any)?.user?.userId as string | undefined;
  const parse = createCustomerSchema.safeParse(req.body);
  if (!parse.success) {
    return next(new ErrorHandler("Invalid request body", 400));
  }
  const { userId: bodyUserId, billingInfo } = parse.data;
  const userId = authUserId || bodyUserId;
  if (!userId) return next(new ErrorHandler("User ID is required", 400));
  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User Not Found", 400));
    }

    // If user does not have a Stripe customer, create one
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        address: billingInfo
          ? {
              line1: billingInfo.address,
              city: billingInfo.city,
              state: billingInfo.state,
              postal_code: billingInfo.postalCode,
              country: billingInfo.country,
            }
          : undefined,
      });
      user.stripeCustomerId = customer.id;
    }
    // Update billing info regardless if provided
    if (billingInfo) {
      user.billingInfo = billingInfo;
    }
    await user.save();

    sendResponse(
      res,
      { stripeCustomerId: user.stripeCustomerId },
      "Customer created/updated successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a PaymentIntent for a charge.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { customerId, amount, currency } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method_types: ["card"],
      setup_future_usage: "off_session",
    });
    sendResponse(
      res,
      { clientSecret: paymentIntent.client_secret },
      "PaymentIntent created successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Save a payment method: attach the provided paymentMethodId to the customer,
 * update it as the default payment method, and update the user document
 * with card information.
 *
 * Expects `customerId` and `paymentMethodId` in req.body.
 */
export const savePaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const parse = savePaymentMethodSchema.safeParse(req.body);
  if (!parse.success)
    return next(new ErrorHandler("Invalid request body", 400));
  const { paymentMethodId, customerId: providedCustomerId } = parse.data;
  try {
    // Derive customerId from authenticated user when possible
    const authUserId = (req as any)?.user?.userId as string | undefined;
    let customerId = providedCustomerId;
    if (authUserId) {
      const u = await User.findById(authUserId);
      if (!u) return next(new ErrorHandler("User not found", 404));
      if (!u.stripeCustomerId)
        return next(new ErrorHandler("Stripe customer not found", 404));
      customerId = u.stripeCustomerId;
    }
    if (!customerId)
      return next(new ErrorHandler("Customer ID is required", 400));
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set it as the default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    // Update user record with card info if available
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user && paymentMethod.card) {
      user.creditCardInfo = {
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month.toString(),
        expiryYear: paymentMethod.card.exp_year.toString(),
      };
      await user.save();
    }
    sendResponse(
      res,
      { last4: paymentMethod.card?.last4, user: user },
      "Card saved as default",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a SetupIntent for saving/updating card information.
 * This endpoint expects an authenticated user (req.userId set via auth middleware).
 */
export const createSetupIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Prefer authenticated user
    const authUserId = (req as any)?.user?.userId as string | undefined;
    const parsed = createSetupIntentSchema.safeParse(req.body);
    const bodyUserId = parsed.success ? parsed.data.userId : undefined;
    const userId = authUserId || bodyUserId;
    if (!userId) {
      return next(new ErrorHandler("User ID is required", 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // If the user does not have a Stripe customer, create one first.
    if (!user.stripeCustomerId) {
      const stripeAddress = user.billingInfo
        ? {
            line1: user.billingInfo.address,
            city: user.billingInfo.city,
            state: user.billingInfo.state,
            postal_code: user.billingInfo.postalCode,
            country: user.billingInfo.country,
          }
        : undefined;

      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          address: stripeAddress,
        });
        user.stripeCustomerId = customer.id;
        await user.save();
      } catch (innerError) {
        console.error("Error during stripe.customers.create:", innerError);
        return next(innerError);
      }
      // user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create the SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ["card"],
    });

    sendResponse(
      res,
      { clientSecret: setupIntent.client_secret },
      "SetupIntent created successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a PaymentMethod by its ID.
 * Expects `paymentMethodId` in req.body.
 */
export const retrievePaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const parse = retrievePaymentMethodSchema.safeParse(req.body);
  if (!parse.success)
    return next(new ErrorHandler("Invalid request body", 400));
  const { paymentMethodId } = parse.data;
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!paymentMethod) {
      throw new ErrorHandler("Invalid payment method ID", 400);
    }
    sendResponse(
      res,
      { paymentMethod },
      "Payment method retrieved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Charge the customer using the saved default payment method.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
export const chargeCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authUserId = (req as any)?.user?.userId as string | undefined;
  const parse = chargeSchema.safeParse(req.body);
  if (!parse.success)
    return next(new ErrorHandler("Invalid request body", 400));
  const {
    customerId: providedCustomerId,
    amount,
    currency,
    userId: bodyUserId,
    purchasedCredit,
    credits,
    idempotencyKey,
  } = parse.data;
  const userId = authUserId || bodyUserId;
  if (!userId) return next(new ErrorHandler("User ID is required", 400));
  try {
    const actingUser = await User.findById(userId);
    if (!actingUser) return next(new ErrorHandler("User not found", 404));
    const customerId = actingUser.stripeCustomerId || providedCustomerId;
    if (!customerId) return next(new ErrorHandler("Customer not found", 404));

    const customer = (await stripe.customers.retrieve(
      customerId
    )) as Stripe.Customer;
    // Determine the default payment method ID. It might be a string or an object.
    let defaultPaymentMethodId: string | undefined;
    if (typeof customer.invoice_settings.default_payment_method === "string") {
      defaultPaymentMethodId = customer.invoice_settings.default_payment_method;
    } else if (
      typeof customer.invoice_settings.default_payment_method === "object" &&
      customer.invoice_settings.default_payment_method !== null
    ) {
      defaultPaymentMethodId =
        customer.invoice_settings.default_payment_method.id;
    }

    if (!defaultPaymentMethodId) {
      return next(
        new ErrorHandler("Customer has no default payment method.", 400)
      );
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        customer: customerId,
        payment_method: defaultPaymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          userId,
          credits: String(purchasedCredit ?? credits ?? 0),
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    const credited = purchasedCredit ?? credits ?? 0;
    // Update user credits
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: credited } },
      { new: true }
    );

    if (!updatedUser) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Extract receipt URL
    let chargeId: string | undefined;
    let receiptUrl: string | undefined;
    const latestCharge = paymentIntent.latest_charge;
    if (typeof latestCharge === "string") {
      const charge = await stripe.charges.retrieve(latestCharge);
      chargeId = charge.id;
      receiptUrl = (charge as any)?.receipt_url as string | undefined;
    } else if (latestCharge && (latestCharge as any).id) {
      const c: any = latestCharge as any;
      chargeId = c.id;
      receiptUrl = c.receipt_url;
    }

    // Store purchase record
    await CreditPurchase.create({
      userId,
      credits: credited,
      amountCents: amount,
      currency,
      paymentIntentId: paymentIntent.id,
      chargeId,
      receiptUrl,
      status: "succeeded",
    });

    sendResponse(
      res,
      { user: updatedUser, receiptUrl },
      "Charge successful",
      200
    );
  } catch (error) {
    next(error);
  }
};

export const saveBillingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authUserId = (req as any)?.user?.userId as string | undefined;
  const parse = saveBillingInfoSchema.safeParse(req.body);
  if (!parse.success)
    return next(new ErrorHandler("Invalid request body", 400));
  const { userId: bodyUserId, billingInfo } = parse.data;
  const userId = authUserId || bodyUserId;
  // Validate required fields
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }
  if (!billingInfo) {
    return next(new ErrorHandler("Billing information is required", 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Update the user's billingData field
    user.billingInfo = billingInfo;
    await user.save();
    sendResponse(
      res,
      { billingInfo: user.billingInfo },
      "Billing info saved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

// List saved card payment methods for the authenticated user
export const listPaymentMethods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any)?.user?.userId as string | undefined;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));
    const user = await User.findById(userId);
    if (!user?.stripeCustomerId)
      return sendResponse(res, { items: [] }, "No payment methods", 200);
    const pms = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });
    const customer = (await stripe.customers.retrieve(
      user.stripeCustomerId
    )) as Stripe.Customer;
    const defaultPmId =
      typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings.default_payment_method as any)?.id;
    const items = pms.data.map((pm) => ({
      id: pm.id,
      brand: (pm.card && pm.card.brand) || undefined,
      last4: (pm.card && pm.card.last4) || undefined,
      exp_month: (pm.card && pm.card.exp_month) || undefined,
      exp_year: (pm.card && pm.card.exp_year) || undefined,
      isDefault: pm.id === defaultPmId,
    }));
    sendResponse(res, { items }, "Payment methods", 200);
  } catch (err) {
    next(err);
  }
};

// Detach a payment method
export const detachPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parse = detachCardSchema.safeParse(req.body);
  if (!parse.success)
    return next(new ErrorHandler("Invalid request body", 400));
  const { paymentMethodId } = parse.data;
  try {
    const userId = (req as any)?.user?.userId as string | undefined;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));
    const user = await User.findById(userId);
    if (!user?.stripeCustomerId)
      return next(new ErrorHandler("Stripe customer not found", 404));

    const customer = (await stripe.customers.retrieve(
      user.stripeCustomerId
    )) as Stripe.Customer;
    const defaultPmId =
      typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings.default_payment_method as any)?.id;
    if (defaultPmId === paymentMethodId) {
      // If detaching default, require changing default first client-side
      return next(
        new ErrorHandler(
          "Cannot detach the default card. Set a different default first.",
          400
        )
      );
    }
    await stripe.paymentMethods.detach(paymentMethodId);
    sendResponse(res, {}, "Payment method detached", 200);
  } catch (err) {
    next(err);
  }
};

// Set default payment method
export const setDefaultPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parse = setDefaultCardSchema.safeParse(req.body);
  if (!parse.success)
    return next(new ErrorHandler("Invalid request body", 400));
  const { paymentMethodId } = parse.data;
  try {
    const userId = (req as any)?.user?.userId as string | undefined;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));
    const user = await User.findById(userId);
    if (!user?.stripeCustomerId)
      return next(new ErrorHandler("Stripe customer not found", 404));

    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.card) {
      user.creditCardInfo = {
        last4: pm.card.last4,
        brand: pm.card.brand,
        expiryMonth: String(pm.card.exp_month),
        expiryYear: String(pm.card.exp_year),
      } as any;
      await user.save();
    }
    sendResponse(res, { user }, "Default payment method set", 200);
  } catch (err) {
    next(err);
  }
};

// List purchases
export const listPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parse = listPurchasesQuerySchema.safeParse(req.query);
  if (!parse.success) return next(new ErrorHandler("Invalid query", 400));
  const { limit = 20, cursor } = parse.data as any;
  try {
    const userId = (req as any)?.user?.userId as string | undefined;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));
    const filter: any = { userId };
    if (cursor) filter.createdAt = { $lt: new Date(cursor) };
    const items = await CreditPurchase.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const nextCursor =
      items.length === limit
        ? items[items.length - 1].createdAt.toISOString()
        : undefined;
    sendResponse(res, { items, nextCursor }, "Purchases", 200);
  } catch (err) {
    next(err);
  }
};

// Usage summary and recent usage for authenticated user
export const getUsageSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parse = usageQuerySchema.safeParse(req.query);
  if (!parse.success) return next(new ErrorHandler("Invalid query", 400));
  const { period = "month", limit = 5 } = parse.data as any;
  try {
    const userId = (req as any)?.user?.userId as string | undefined;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));
    const now = new Date();
    const start = new Date(now);
    if (period === "month") start.setMonth(start.getMonth() - 1);
    else start.setMonth(start.getMonth() - 3);

    const recent = await LiveUsageLog.find({ startedAt: { $lte: now } })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    // Optionally enrich with session and project names
    const sessionIds = recent.map((r: any) => r.sessionId).filter(Boolean);
    const sessions = await Session.find(
      { _id: { $in: sessionIds } },
      { title: 1 }
    ).lean();
    const sessionMap = new Map<string, any>(
      sessions.map((s: any) => [String(s._id), s])
    );

    const projectIds = recent.map((r: any) => r.projectId).filter(Boolean);
    const projects = await Project.find(
      { _id: { $in: projectIds } },
      { name: 1 }
    ).lean();
    const projectMap = new Map<string, any>(
      projects.map((p: any) => [String(p._id), p])
    );

    const items = recent.map((r: any) => ({
      sessionId: r.sessionId,
      sessionTitle: sessionMap.get(String(r.sessionId))?.title,
      projectId: r.projectId,
      projectName: projectMap.get(String(r.projectId))?.name,
      date: r.startedAt,
      creditsUsed: r.creditsUsed,
    }));

    // Simple summary (sum credits in period)
    const inPeriod = await LiveUsageLog.aggregate([
      { $match: { startedAt: { $gte: start, $lte: now } } },
      { $group: { _id: null, total: { $sum: "$creditsUsed" } } },
    ]);
    const totalCreditsUsed = (inPeriod[0] && inPeriod[0].total) || 0;

    sendResponse(res, { items, totalCreditsUsed, period }, "Usage", 200);
  } catch (err) {
    next(err);
  }
};

// Stripe webhook handler
export const stripeWebhookHandler: RequestHandler = async (
  req,
  res
): Promise<void> => {
  const sig = (req.headers["stripe-signature"] as string) || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent((req as any).body, sig, secret);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const userId = (intent.metadata && intent.metadata.userId) || undefined;
        const creditsMeta = (intent.metadata && intent.metadata.credits) || "0";
        const credits = parseInt(String(creditsMeta), 10) || 0;
        let receiptUrl: string | undefined;
        let chargeId: string | undefined;
        if (typeof intent.latest_charge === "string") {
          const c = await stripe.charges.retrieve(intent.latest_charge);
          chargeId = c.id;
          receiptUrl = (c as any)?.receipt_url as string | undefined;
        }
        if (userId) {
          await CreditPurchase.updateOne(
            { paymentIntentId: intent.id, userId },
            {
              $setOnInsert: {
                credits,
                amountCents: intent.amount,
                currency: intent.currency,
              },
              $set: { status: "succeeded", receiptUrl, chargeId },
            },
            { upsert: true }
          );
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = (charge.payment_intent as string) || undefined;
        await CreditPurchase.updateOne(
          { paymentIntentId },
          { $set: { status: "refunded" } }
        );
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await CreditPurchase.updateOne(
          { paymentIntentId: intent.id },
          { $set: { status: "failed" } },
          { upsert: true }
        );
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // swallow errors to avoid retries loops if desired; could log
  }

  res.json({ received: true });
  return;
};
