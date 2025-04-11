// /components/CardSetupForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "components/ui/button";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getToken, getUser } from "../../../utils/payment";

interface CardSetupFormProps {
  onCardSaved: () => void;
}

export const CardSetupForm: React.FC<CardSetupFormProps> = ({
  onCardSaved,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const token = getToken();

  useEffect(() => {
    let mounted = true;
    const createSetupIntent = async () => {
      try {
        if (!mounted) return;
        const user = getUser();
        if (!user) return toast.error("User not found");

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/create-setup-intent`,
          { userId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Received client secret", response.data.data.clientSecret);
        setClientSecret(response.data.data.clientSecret);
      } catch (err) {
        console.log(err)
        toast.error("Error creating setup intent");
      }
    };
    createSetupIntent();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    const cardElement = elements.getElement(CardElement);

    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement! },
    });

    if (result.error) {
      toast.error(result.error.message || "Error saving card");
      setLoading(false);
      return;
    }

    try {
      if (result.setupIntent.payment_method) {
        const user = getUser();
        if (!user || !user.stripeCustomerId) {
          toast.error("User or Stripe customer not found");
          setLoading(false);
          return;
        }

        const result2 = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/save-payment-method`,
          {
            customerId: user.stripeCustomerId,
            paymentMethodId: result.setupIntent.payment_method,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Optionally update localStorage with the returned user data.
        if (result2.data.data?.user) {
          localStorage.setItem("user", JSON.stringify(result2.data.data.user));
        }
        toast.success("Card saved successfully");
        onCardSaved();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Error retrieving card info");
      } else {
        toast.error("Error retrieving card info");
      }
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-4 rounded-md"
    >
      <h2 className="text-lg font-semibold">Enter Card Details</h2>
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
      <Button type="submit" disabled={loading || !stripe}>
        {loading ? "Saving Card..." : "Save Card & Pay"}
      </Button>
    </form>
  );
};

export default CardSetupForm;
