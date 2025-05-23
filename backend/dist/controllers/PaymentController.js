"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBillingInfo = exports.chargeCustomer = exports.retrievePaymentMethod = exports.createSetupIntent = exports.savePaymentMethod = exports.createPaymentIntent = exports.createCustomer = void 0;
const responseHelpers_1 = require("../utils/responseHelpers");
const UserModel_1 = __importDefault(require("../model/UserModel"));
const ErrorHandler_1 = __importDefault(require("../../shared/utils/ErrorHandler"));
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
/**
 * Create or update a Stripe customer.
 * Expects `userId` and (optionally) `billingInfo` (conforming to IBillingInfo)
 * in req.body.
 */
const createCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, billingInfo } = req.body;
    if (!userId) {
        return next(new ErrorHandler_1.default("User ID is required", 400));
    }
    try {
        const user = yield UserModel_1.default.findById(userId);
        if (!user) {
            return next(new ErrorHandler_1.default("User Not Found", 400));
        }
        // If user does not have a Stripe customer, create one
        if (!user.stripeCustomerId) {
            const customer = yield stripe.customers.create({
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
        yield user.save();
        (0, responseHelpers_1.sendResponse)(res, { stripeCustomerId: user.stripeCustomerId }, "Customer created/updated successfully", 200);
    }
    catch (error) {
        next(error);
    }
});
exports.createCustomer = createCustomer;
/**
 * Create a PaymentIntent for a charge.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
const createPaymentIntent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, amount, currency } = req.body;
    try {
        const paymentIntent = yield stripe.paymentIntents.create({
            amount,
            currency,
            customer: customerId,
            payment_method_types: ["card"],
            setup_future_usage: "off_session",
        });
        (0, responseHelpers_1.sendResponse)(res, { clientSecret: paymentIntent.client_secret }, "PaymentIntent created successfully", 200);
    }
    catch (error) {
        next(error);
    }
});
exports.createPaymentIntent = createPaymentIntent;
/**
 * Save a payment method: attach the provided paymentMethodId to the customer,
 * update it as the default payment method, and update the user document
 * with card information.
 *
 * Expects `customerId` and `paymentMethodId` in req.body.
 */
const savePaymentMethod = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { customerId, paymentMethodId } = req.body;
    try {
        // Attach payment method to customer
        yield stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
        // Set it as the default payment method
        yield stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });
        const paymentMethod = yield stripe.paymentMethods.retrieve(paymentMethodId);
        // Update user record with card info if available
        const user = yield UserModel_1.default.findOne({ stripeCustomerId: customerId });
        if (user && paymentMethod.card) {
            user.creditCardInfo = {
                last4: paymentMethod.card.last4,
                brand: paymentMethod.card.brand,
                expiryMonth: paymentMethod.card.exp_month.toString(),
                expiryYear: paymentMethod.card.exp_year.toString(),
            };
            yield user.save();
        }
        console.log("last 4", paymentMethod.card);
        (0, responseHelpers_1.sendResponse)(res, { last4: (_a = paymentMethod.card) === null || _a === void 0 ? void 0 : _a.last4, user: user }, "Card saved as default", 200);
    }
    catch (error) {
        next(error);
    }
});
exports.savePaymentMethod = savePaymentMethod;
/**
 * Create a SetupIntent for saving/updating card information.
 * This endpoint expects an authenticated user (req.userId set via auth middleware).
 */
const createSetupIntent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use our extended Request type so that userId exists.
        const userId = req.body.userId;
        if (!userId) {
            return next(new ErrorHandler_1.default("User ID is required", 400));
        }
        const user = yield UserModel_1.default.findById(userId);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
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
                const customer = yield stripe.customers.create({
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    address: stripeAddress,
                });
                user.stripeCustomerId = customer.id;
                yield user.save();
            }
            catch (innerError) {
                console.error("Error during stripe.customers.create:", innerError);
                return next(innerError);
            }
            // console.log('customer', customer)
            // user.stripeCustomerId = customer.id;
            yield user.save();
        }
        // Create the SetupIntent
        const setupIntent = yield stripe.setupIntents.create({
            customer: user.stripeCustomerId,
            payment_method_types: ["card"],
        });
        console.log("user setup intent", setupIntent.client_secret);
        (0, responseHelpers_1.sendResponse)(res, { clientSecret: setupIntent.client_secret }, "SetupIntent created successfully", 200);
    }
    catch (error) {
        next(error);
    }
});
exports.createSetupIntent = createSetupIntent;
/**
 * Retrieve a PaymentMethod by its ID.
 * Expects `paymentMethodId` in req.body.
 */
const retrievePaymentMethod = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentMethodId, userId } = req.body;
    try {
        const paymentMethod = yield stripe.paymentMethods.retrieve(paymentMethodId);
        if (!paymentMethod) {
            throw new ErrorHandler_1.default("Invalid payment method ID", 400);
        }
        const user = yield UserModel_1.default.findById(userId);
        console.log("user", user);
        (0, responseHelpers_1.sendResponse)(res, { paymentMethod, user }, "Payment method retrieved successfully", 200);
    }
    catch (error) {
        next(error);
    }
});
exports.retrievePaymentMethod = retrievePaymentMethod;
/**
 * Charge the customer using the saved default payment method.
 * Expects `customerId`, `amount` (in cents), and `currency` in req.body.
 */
const chargeCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, amount, currency, userId, purchasedCredit } = req.body;
    try {
        const customer = (yield stripe.customers.retrieve(customerId));
        // Determine the default payment method ID. It might be a string or an object.
        let defaultPaymentMethodId;
        if (typeof customer.invoice_settings.default_payment_method === "string") {
            defaultPaymentMethodId = customer.invoice_settings.default_payment_method;
        }
        else if (typeof customer.invoice_settings.default_payment_method === "object" &&
            customer.invoice_settings.default_payment_method !== null) {
            defaultPaymentMethodId =
                customer.invoice_settings.default_payment_method.id;
        }
        if (!defaultPaymentMethodId) {
            return next(new ErrorHandler_1.default("Customer has no default payment method.", 400));
        }
        const paymentIntent = yield stripe.paymentIntents.create({
            amount,
            currency,
            customer: customerId,
            payment_method: defaultPaymentMethodId,
            off_session: true,
            confirm: true,
        });
        // Find the user using userId and add the purchased credits
        const updatedUser = yield UserModel_1.default.findByIdAndUpdate(userId, { $inc: { credits: purchasedCredit } }, { new: true });
        console.log('updated user', updatedUser);
        if (!updatedUser) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        (0, responseHelpers_1.sendResponse)(res, { user: updatedUser }, "Charge successful", 200);
    }
    catch (error) {
        next(error);
    }
});
exports.chargeCustomer = chargeCustomer;
const saveBillingInfo = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, billingInfo } = req.body;
    // console.log( billingData)
    // Validate required fields
    if (!userId) {
        return next(new ErrorHandler_1.default("User ID is required", 400));
    }
    if (!billingInfo) {
        return next(new ErrorHandler_1.default("Billing information is required", 400));
    }
    try {
        const user = yield UserModel_1.default.findById(userId);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        // Update the user's billingData field
        user.billingInfo = billingInfo;
        yield user.save();
        console.log("user", user);
        (0, responseHelpers_1.sendResponse)(res, { billingInfo: user.billingInfo }, "Billing info saved successfully", 200);
    }
    catch (error) {
        next(error);
    }
});
exports.saveBillingInfo = saveBillingInfo;
