import { z } from "zod";

export const billingInfoSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

export const createCustomerSchema = z.object({
  userId: z.string().min(1).optional(),
  billingInfo: billingInfoSchema.optional(),
});

export const createSetupIntentSchema = z.object({
  userId: z.string().min(1).optional(),
});

export const savePaymentMethodSchema = z.object({
  customerId: z.string().min(1).optional(),
  paymentMethodId: z.string().min(1),
});

export const retrievePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

export const saveBillingInfoSchema = z.object({
  userId: z.string().min(1).optional(),
  billingInfo: billingInfoSchema,
});

export const chargeSchema = z.object({
  customerId: z.string().min(1).optional(),
  amount: z.number().int().positive(),
  currency: z.string().min(1),
  userId: z.string().min(1).optional(),
  purchasedCredit: z.number().int().positive().optional(),
  credits: z.number().int().positive().optional(),
  idempotencyKey: z.string().min(10).optional(),
});

export const listCardsSchema = z.object({});

export const detachCardSchema = z.object({
  paymentMethodId: z.string().min(1),
});

export const setDefaultCardSchema = z.object({
  paymentMethodId: z.string().min(1),
});

export const listPurchasesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const usageQuerySchema = z.object({
  period: z.enum(["month", "quarter"]).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type BillingInfoInput = z.infer<typeof billingInfoSchema>;
