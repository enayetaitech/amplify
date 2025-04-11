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
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { IProjectFormState } from "app/(dashboard)/create-project/page";
import { IProject } from "@shared/interface/project.interface";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface PaymentIntegrationProps {
  totalPurchasePrice: number;
  totalCreditsNeeded: number;
  projectData: IProjectFormState;
  uniqueId: string | null;
}


export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  totalPurchasePrice,
  totalCreditsNeeded,
  projectData,
  uniqueId,
}) => {
  const user = getUser();
  const router = useRouter();
  if (!user) return <div className="text-red-500">User not found</div>;

  const [isChangingCard, setIsChangingCard] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);

  // Mutation to hit create-project-by-external-admin endpoint
  const createProjectMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      uniqueId: string | null;
      projectData: Partial<IProject>;
    }) => {
      return axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/create-project-by-external-admin`,
        data
      );
    },
    onSuccess: () => {
      toast.success("Project created successfully and payment complete!");
      router.push("/projects");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Project creation failed");
    },
  });

  // Function to format raw form data into the payload format expected by the backend
  const formatProjectData = (rawData: IProjectFormState): Partial<IProject> => {
    return {
      name: rawData.name,
      description:"",
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
    try {
      const amountCents = Math.round(totalPurchasePrice * 100);
      console.log("Charging amount (cents):", amountCents);
      await chargeWithSavedCard(amountCents, totalCreditsNeeded);

      const formattedProjectData = formatProjectData(projectData);

      createProjectMutation.mutate({
        userId: user._id,
        uniqueId,
        projectData:formattedProjectData,
      });
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
const PaymentIntegrationWrapper: React.FC<PaymentIntegrationProps> = (props) => (
  <Elements stripe={stripePromise}>
    <PaymentIntegration  {...props}/>
  </Elements>
);

export default PaymentIntegrationWrapper;
