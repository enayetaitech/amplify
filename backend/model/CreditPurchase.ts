import { Schema, model, Document, Types } from "mongoose";

export interface CreditPurchaseDoc extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  credits: number;
  amountCents: number;
  currency: string;
  paymentIntentId?: string;
  chargeId?: string;
  receiptUrl?: string;
  status: "succeeded" | "requires_action" | "failed" | "refunded";
  createdAt: Date;
}

const CreditPurchaseSchema = new Schema<CreditPurchaseDoc>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  credits: { type: Number, required: true },
  amountCents: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentIntentId: { type: String },
  chargeId: { type: String },
  receiptUrl: { type: String },
  status: {
    type: String,
    enum: ["succeeded", "requires_action", "failed", "refunded"],
    required: true,
    default: "succeeded",
    index: true,
  },
  createdAt: { type: Date, default: () => new Date(), index: true },
});

CreditPurchaseSchema.index({ userId: 1, createdAt: -1 });

export default model<CreditPurchaseDoc>("CreditPurchase", CreditPurchaseSchema);
