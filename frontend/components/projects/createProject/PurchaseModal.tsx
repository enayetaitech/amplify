// components/PurchaseModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "components/ui/table";
import BillingForm from "./BillingFormComponent";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import PaymentIntegrationWrapper from "./PaymentIntegrationComponent";
import { Card } from "components/ui/card";
import CustomButton from "components/shared/CustomButton";
import { IProjectFormState } from "@shared/interface/CreateProjectInterface";

interface PurchaseModalProps {
  creditPackages: { package: number; cost: number }[];
  purchaseQuantities: Record<number, number>;
  totalPurchasePrice: number;
  totalCreditsNeeded: number;
  projectData: IProjectFormState;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  creditPackages,
  purchaseQuantities,
  totalPurchasePrice,
  totalCreditsNeeded,

  projectData,
}) => {
  const { user, setUser } = useGlobalContext();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // 1️⃣ Ensure Stripe Customer exists before step 2
  const createCustomerMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/payment/create-customer", {
        userId: user?._id,
        billingInfo: user?.billingInfo,
      }),
    onSuccess: (res) => {
      // response contains stripeCustomerId
      setUser({ ...user!, stripeCustomerId: res.data.data.stripeCustomerId });
      setStep(2);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  // Mutation to hit create-project-by-external-admin endpoint
  // const createProjectMutation = useMutation({
  //   mutationFn: () =>
  //     api.post("/api/v1/projects/create-project-by-external-admin", {
  //       userId: user?._id,
  //       uniqueId,
  //       projectData: formatProjectData(projectData as IProjectFormState),
  //       totalPurchasePrice,
  //       totalCreditsNeeded,
  //     }),
  //   onSuccess: () => {
  //     toast.success("Project created successfully!");
  //     router.push("/projects");
  //   },
  //   onError: (err) => {
  //     toast.error(
  //       axios.isAxiosError(err)
  //         ? err.response?.data?.message || "Project creation failed"
  //         : "Project creation failed"
  //     );
  //   },
  // });

  // Function to format raw form data into the payload format expected by the backend
  // const formatProjectData = (rawData: IProjectFormState): Partial<IProject> => {
  //   return {
  //     name: rawData.name,
  //     description: "",
  //     startDate: new Date(rawData.firstDateOfStreaming),
  //     service: rawData.service as "Concierge" | "Signature",
  //     respondentCountry: rawData.respondentCountry,
  //     respondentLanguage: Array.isArray(rawData.respondentLanguage)
  //       ? rawData.respondentLanguage.join(", ")
  //       : rawData.respondentLanguage,
  //     sessions: rawData.sessions.map((session) => ({
  //       number: session.number,
  //       duration: session.duration,
  //     })),
  //     cumulativeMinutes: 0,
  //     status: "Draft",
  //     tags: [],
  //   };
  // };

  // Helpers
  const handleNext = () => {
    if (!user?.billingInfo) {
      // user just filled billing form → mutate to createCustomer
      createCustomerMutation.mutate();
    } else {
      setStep(2);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!open) setStep(1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-teal hover:bg-custom-dark-blue-3">
          Pay Now
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Checkout" : "Payment Details"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <>
            {/* Summary Table */}
            <Card className="border-0 shadow-md py-0">
              <Table className="py-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Total Price (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditPackages.map((pkg) => {
                    const qty = purchaseQuantities[pkg.package] || 0;
                    if (qty === 0) return null;

                    const lineTotal = qty * pkg.cost;
                    return (
                      <TableRow key={pkg.package}>
                        <TableCell>{qty}</TableCell>
                        <TableCell>{pkg.package}</TableCell>
                        <TableCell>{pkg.cost}</TableCell>
                        <TableCell>{lineTotal}</TableCell>
                      </TableRow>
                    );
                  })}

                  {/* final total row */}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={3} className="text-right">
                      Total Price (USD)
                    </TableCell>
                    <TableCell>{totalPurchasePrice.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            {/* Billing */}
            {!user?.billingInfo && (
              <BillingForm
                onSuccess={() => {
                  // After billing saved, refetch user from server
                  api.get("/api/v1/users/me").then((r) => {
                    setUser(r.data.data.user);
                    handleNext();
                  });
                }}
              />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <PaymentIntegrationWrapper
              totalPurchasePrice={totalPurchasePrice}
              totalCreditsNeeded={totalCreditsNeeded}
              projectData={projectData}
              uniqueId={null}
            />
          </>
        )}

        <DialogFooter className="flex justify-end space-x-2">
          {step === 1 && (
            <CustomButton
              onClick={handleNext}
              disabled={
                createCustomerMutation.isPending ||
                (!!user?.billingInfo && false)
              }
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
            >
              Next
            </CustomButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
