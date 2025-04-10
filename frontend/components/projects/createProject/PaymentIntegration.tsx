// /components/PaymentIntegration.tsx
"use client";
import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import CardSetupForm from "./CardSetupForm";
import BillingForm from "./BillingForm";
import { getUser, chargeWithSavedCard } from "../../../utils/payment";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface PaymentIntegrationProps {
  totalPurchasePrice: number;
}

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  totalPurchasePrice,
}) => {
  const user = getUser();
  const router = useRouter();
  if (!user) return <div className="text-red-500">User not found</div>;

  const [isChangingCard, setIsChangingCard] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);

  const handleUseSavedCard = async () => {
    setChargeLoading(true);
    try {
      const amountCents = Math.round(totalPurchasePrice * 100);
      console.log("Charging amount (cents):", amountCents);
      await chargeWithSavedCard(amountCents);
      router.push("/projects");
      toast.success("Payment successful!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Payment failed");
    } finally {
      setChargeLoading(false);
    }
  };

  const hasBilling = Boolean(user.billingInfo);
  const hasCard = Boolean(user.creditCardInfo?.last4);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Payment Integration</h2>
      {/* Billing Form */}
      {!hasBilling && (
        <div>
          <p className="mb-4">We need your billing information first.</p>
          <BillingForm onSuccess={() => { /* Optionally refresh user info */ }} />
        </div>
      )}
      {/* Card Setup Form */}
      {hasBilling && (!hasCard || isChangingCard) && (
        <CardSetupForm onCardSaved={() => setIsChangingCard(false)} />
      )}
      {/* Saved Card Display */}
      {hasBilling && hasCard && !isChangingCard && (
        <div className="space-y-4 border p-4 rounded-md">
          <p>
            Your saved card ending in{" "}
            <span className="font-medium">{user.creditCardInfo?.last4}</span> is on file.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleUseSavedCard} disabled={chargeLoading}>
              {chargeLoading ? "Processing..." : "Use this Card"}
            </Button>
            <Button variant="outline" onClick={() => setIsChangingCard(true)}>
              Change Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap PaymentIntegration with Stripe Elements
const PaymentIntegrationWrapper: React.FC<PaymentIntegrationProps> = ({
  totalPurchasePrice,
}) => (
  <Elements stripe={stripePromise}>
    <PaymentIntegration totalPurchasePrice={totalPurchasePrice} />
  </Elements>
);

export default PaymentIntegrationWrapper;
