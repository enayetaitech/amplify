// /components/PaymentIntegration.tsx
"use client";
import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import CardSetupForm from "./CardSetupFormComponent";
import BillingForm from "./BillingFormComponent";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  IProjectFormState,
  PaymentIntegrationProps,
} from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";
import { Card } from "components/ui/card";
import CustomButton from "components/shared/CustomButton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "components/ui/dialog";

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
  const queryClient = useQueryClient()

  const [isChangingCard, setIsChangingCard] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);

  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(
    null
  );

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
    unknown,
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
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
     
      toast.success("Payment successful");
      createProjectMutation.mutate();
      
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });
  // Mutation to hit create-project-by-external-admin endpoint
  const createProjectMutation = useMutation<
    ApiResponse<{ data: { _id: string } }>,
    unknown,
    void
  >({
    mutationFn: () =>
      api.post("/api/v1/projects/create-project-by-external-admin", {
        userId: user?._id,
        uniqueId,
        projectData: formatProjectData(projectData as IProjectFormState),
        totalPurchasePrice,
        totalCreditsNeeded,
      }),
    onSuccess: (response) => {
      console.log('create project response', response)
      const newId = response.data.data._id
      setCreatedProjectId(newId)
      setShowCreatedModal(true)
      // toast.success("Project created successfully!");
      queryClient.invalidateQueries({ queryKey: ["projectsByUser", user?._id] });
      // router.push("/projects");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
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
    <div className="space-y-6">
      {/* <h2 className="text-2xl font-bold">Payment Integration</h2> */}
      {/* Billing Form */}
      {!hasBilling && (
        <div>
          <p className="mb-4">We need your billing information first.</p>
          <BillingForm onSuccess={refetchUser} />
        </div>
      )}
      {/* Card Setup Form */}
      {hasBilling && (!hasCard || isChangingCard) && (
        <CardSetupForm
          onCardSaved={() => {
            const amountCents = Math.round(totalPurchasePrice * 100);
            if (!user?.stripeCustomerId) {
              return toast.error("No Stripe customer ID available");
            }

            chargeMutation.mutate({
              amount: amountCents,
              credits: totalCreditsNeeded,
              customerId: user.stripeCustomerId,
              userId: user._id!,
            });
          }}
        />
      )}
      {/* Saved Card Display */}
      {hasBilling && hasCard && !isChangingCard && (
        <Card className="space-y-4 border-0 shadow-sm p-4">
          <p>
            Your saved card ending in{" "}
            <span className="font-medium">{user.creditCardInfo?.last4}</span> is
            on file.
          </p>
          <div className="flex space-x-4">
            <CustomButton
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              onClick={handleUseSavedCard}
              disabled={chargeLoading}
            >
              {chargeLoading ? "Processing..." : "Use this Card"}
            </CustomButton>
            <CustomButton
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              onClick={() => setIsChangingCard(true)}
              disabled={chargeLoading}
            >
              Change Card
            </CustomButton>
          </div>
        </Card>
      )}

      <Dialog
        open={showCreatedModal}
        onOpenChange={(open) => {
          if (!open) {
            // if they click outside, treat like “No”
            router.push("/projects");
          }
          setShowCreatedModal(open);
        }}
        
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Created!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Do you want to set up your project now?
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <CustomButton
              variant="outline"
              onClick={() => {
                setShowCreatedModal(false);
                router.push("/projects");
              }}
            >
              No
            </CustomButton>
            <CustomButton
              onClick={() => {
                setShowCreatedModal(false);
                router.push(`/view-project/${createdProjectId}`);
              }}
              className="bg-custom-teal text-white hover:bg-custom-dark-blue-3"
            >
              Yes
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
