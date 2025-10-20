// /components/CardSetupForm.tsx
"use client";
import React from "react";
import { toast } from "sonner";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CardSetupFormProps } from "@shared/interface/CreateProjectInterface";
import { useQuery } from "@tanstack/react-query";
import {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { Card } from "components/ui/card";
import CustomButton from "components/shared/CustomButton";
import { useSaveCard } from "../../../hooks/useSaveCard";

export const CardSetupForm: React.FC<CardSetupFormProps> = ({
  onCardSaved,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const { user } = useGlobalContext();

  // 1️⃣ Fetch Setup Intent
  const { data: clientSecret, isLoading: loadingSecret } = useQuery<
    string,
    ErrorResponse
  >({
    queryKey: ["stripeSetupIntent", user?._id],
    queryFn: async () => {
      if (!user || !user._id) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ clientSecret: string }>>(
        "/api/v1/payment/create-setup-intent",
        { userId: user._id }
      );
      return res.data.data.clientSecret;
    },
    enabled: Boolean(user?._id),
  });

  const { mutate: saveCard, isPending: isSavingCard } = useSaveCard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    // Confirm setup intent with Stripe.js
    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardEl },
    });
    if (error) {
      toast.error(error.message || "Error during card setup");
      return;
    }

    // Extract the payment method ID
    const pmField = setupIntent.payment_method;
    const pmId = typeof pmField === "string" ? pmField : pmField?.id;
    if (!pmId) {
      toast.error("Unable to retrieve payment method ID");
      return;
    }

    // Kick off the backend mutation
    saveCard(pmId, {
      onSuccess: () => {
        // Clear the card input after successful save
        elements.getElement(CardElement)?.clear();
        onCardSaved();
      },
    });
  };

  if (loadingSecret) {
    return <p>Loading payment form…</p>;
  }

  return (
    <Card className="border-0 p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <h2 className="text-lg font-semibold">Billing Details</h2>

        <div className="border p-4 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#32325d",
                  "::placeholder": { color: "#aab7c4" },
                },
              },
            }}
          />
        </div>
        <CustomButton
          type="submit"
          disabled={!stripe || isSavingCard}
          className="bg-custom-teal hover:bg-custom-dark-blue-3"
        >
          {isSavingCard ? "Saving Card..." : "Save Card & Pay"}
        </CustomButton>
      </form>
    </Card>
  );
};

export default CardSetupForm;
