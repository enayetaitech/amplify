// /components/PaymentIntegration.tsx
"use client";
import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import CardSetupForm from "./CardSetupFormComponent";
import BillingForm from "./BillingFormComponent";
import { PaymentIntegrationProps } from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "../../../context/GlobalContext";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";
import { Card } from "../../ui/card";
import CustomButton from "../../shared/CustomButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { useChargePayment } from "hooks/useChargePayment";
import { useCreateExternalProject } from "hooks/useCreateProjectByExternalAdmin";
import { formatProjectData } from "utils/formatProjectData";

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

  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [isProcessingFlow, setIsProcessingFlow] = useState(false);

  // 1️⃣ A helper to re-fetch the logged-in user's profile
  const refetchUser = async () => {
    const resp = await api.get<ApiResponse<{ user: IUser }>>(
      "/api/v1/users/me"
    );

    const fresh = resp.data.data.user;
    setUser(fresh);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(fresh));
    }
  };

  const { mutate: chargePayment, isPending: isCharging } = useChargePayment(
    () => {
      createProject({
        uniqueId: uniqueId!,
        formState: projectData,
        totalPurchasePrice,
        totalCreditsNeeded,
      });
    }
  );

  const { mutate: createProject } = useCreateExternalProject(
    formatProjectData,
    (newId) => {
      setCreatedProjectId(newId);
      // Make sure any processing flag is cleared so the dialog buttons are enabled
      setIsProcessingFlow(false);
      setShowCreatedModal(true);
    }
  );

  if (!user) return <div className="text-red-500">User not found</div>;

  const handleUseSavedCard = async () => {
    if (!user.stripeCustomerId) {
      return toast.error("No Stripe customer ID available");
    }
    const amountCents = Math.round(totalPurchasePrice * 100);
    setIsProcessingFlow(true);

    chargePayment({
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

            setIsProcessingFlow(true);

            chargePayment({
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
              disabled={isCharging || isProcessingFlow}
            >
              {isCharging ? "Processing..." : "Use this Card"}
            </CustomButton>
            <CustomButton
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              onClick={() => setIsChangingCard(true)}
              disabled={isCharging || isProcessingFlow}
            >
              Change Card
            </CustomButton>
          </div>
        </Card>
      )}

      <Dialog
        open={showCreatedModal}
        onOpenChange={(open) => {
          // Only navigate on close when we're not already performing a navigation
          if (!open && !isProcessingFlow) {
            router.push("/projects");
          }
          setShowCreatedModal(open);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Created!</DialogTitle>
          </DialogHeader>
          <div className="py-4">Do you want to set up your project now?</div>
          <DialogFooter className="flex justify-end space-x-2">
            <CustomButton
              variant="outline"
              onClick={async () => {
                // mark processing first so onOpenChange doesn't trigger navigation
                setIsProcessingFlow(true);
                setShowCreatedModal(false);
                await router.push("/projects");
                setIsProcessingFlow(false);
              }}
              disabled={isProcessingFlow}
            >
              No
            </CustomButton>
            <CustomButton
              onClick={async () => {
                // mark processing first so onOpenChange doesn't trigger navigation
                setIsProcessingFlow(true);
                setShowCreatedModal(false);
                await router.push(`/view-project/${createdProjectId}`);
                setIsProcessingFlow(false);
              }}
              className="bg-custom-teal text-white hover:bg-custom-dark-blue-3"
              disabled={isProcessingFlow}
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
