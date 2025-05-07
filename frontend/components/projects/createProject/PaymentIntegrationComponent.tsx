// /components/PaymentIntegration.tsx
"use client";
import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import CardSetupForm from "./CardSetupFormComponent";
import BillingForm from "./BillingFormComponent";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  IProjectFormState,
  PaymentIntegrationProps,
} from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  totalPurchasePrice,
  totalCreditsNeeded,
  projectData,
  uniqueId,
}) => {
  const { user, setUser } = useGlobalContext();
  const router = useRouter();

  const [isChangingCard, setIsChangingCard] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);

  // 1️⃣ A helper to re-fetch the logged-in user's profile
  const refetchUser = async () => {
    const resp = await api.get<ApiResponse<{ user: IUser }>>(
      "/api/v1/users/me"
    );

    const fresh = resp.data.data.user;
    setUser(fresh);
    // ADD THIS:
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(fresh));
    }
  };

  // 1️⃣ Mutation to charge saved card
  const chargeMutation = useMutation<
    // TData
    { data: { user: typeof user } },
    // TError
    unknown,
    // TVariables
    { amount: number; credits: number; userId: string; customerId: string }
  >({
    mutationFn: ({ amount, credits, customerId, userId }) =>
      api
        .post<ApiResponse<{ user: IUser }>>("/api/v1/payment/charge", {
          customerId,
          amount,
          currency: "usd",
          userId,
          purchasedCredit: credits,
        })
        .then((res) => res.data),
    onSuccess: (apiResp) => {
      const updatedUser = apiResp.data.user;
      // persist and update context
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Payment successful");
      // now create project
      createProjectMutation.mutate();
    },
    onError: (err) => {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Payment failed"
          : "Payment failed"
      );
    },
  });
  // Mutation to hit create-project-by-external-admin endpoint
  const createProjectMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/projects/create-project-by-external-admin", {
        userId: user?._id,
        uniqueId,
        projectData: formatProjectData(projectData as IProjectFormState),
        totalPurchasePrice,
        totalCreditsNeeded,
      }),
    onSuccess: () => {
      toast.success("Project created successfully!");
      router.push("/projects");
    },
    onError: (err) => {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Project creation failed"
          : "Project creation failed"
      );
    },
  });

  if (!user) return <div className="text-red-500">User not found</div>;

  // Function to format raw form data into the payload format expected by the backend
  const formatProjectData = (rawData: IProjectFormState): Partial<IProject> => {
    return {
      name: rawData.name,
      description: "",
      startDate: new Date(rawData.firstDateOfStreaming),
      service: rawData.service as "Concierge" | "Signature",
      respondentCountry: rawData.respondentCountry,
      respondentLanguage: Array.isArray(rawData.respondentLanguage)
        ? rawData.respondentLanguage.join(", ")
        : rawData.respondentLanguage,
      sessions: rawData.sessions.map((session) => ({
        number: session.number,
        duration: session.duration,
      })),
      cumulativeMinutes: 0,
      status: "Draft",
      tags: [],
    };
  };

  const handleUseSavedCard = async () => {
    setChargeLoading(true);

    const amountCents = Math.round(totalPurchasePrice * 100);
    console.log("Charging amount (cents):", amountCents);
    if (!user.stripeCustomerId) {
      return toast.error("No Stripe customer ID available");
    }

    chargeMutation.mutate({
      amount: amountCents,
      credits: totalCreditsNeeded,
      customerId: user.stripeCustomerId,
      userId: user._id!,
    });
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
          <BillingForm onSuccess={refetchUser} />
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
            <span className="font-medium">{user.creditCardInfo?.last4}</span> is
            on file.
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
const PaymentIntegrationWrapper: React.FC<PaymentIntegrationProps> = (
  props
) => (
  <Elements stripe={stripePromise}>
    <PaymentIntegration {...props} />
  </Elements>
);

export default PaymentIntegrationWrapper;
