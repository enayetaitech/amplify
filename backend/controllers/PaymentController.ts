import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHelpers";
import User from "../model/UserModel";
import ErrorHandler from "../utils/ErrorHandler";
import Stripe from "stripe";
import dotenv from "dotenv";

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
  const { userId, billingInfo } = req.body;
  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }
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
        address: billingInfo,
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
  const { customerId, paymentMethodId } = req.body;
  try {
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
    // Use our extended Request type so that userId exists.
    const userId = req.body.userId;
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
  const { paymentMethodId, userId } = req.body;
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!paymentMethod) {
      throw new ErrorHandler("Invalid payment method ID", 400);
    }

    const user = await User.findById(userId);
    sendResponse(
      res,
      { paymentMethod, user },
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
  const { customerId, amount, currency, userId, purchasedCredit } = req.body;
  try {
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: defaultPaymentMethodId,
      off_session: true,
      confirm: true,
    });

    // Find the user using userId and add the purchased credits
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: purchasedCredit } },
      { new: true }
    );

    if (!updatedUser) {
      return next(new ErrorHandler("User not found", 404));
    }

    sendResponse(res, { user: updatedUser }, "Charge successful", 200);
  } catch (error) {
    next(error);
  }
};

export const saveBillingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId, billingInfo } = req.body;
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
