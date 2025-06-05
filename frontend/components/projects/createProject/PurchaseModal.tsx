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
import PaymentIntegrationWrapper from "./PaymentIntegrationComponent";
import { Card } from "components/ui/card";
import CustomButton from "components/shared/CustomButton";
import { IProjectFormState } from "@shared/interface/CreateProjectInterface";
import { useCreateCustomer } from "hooks/useCreateCustomer";

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

 const createCustomerMutation = useCreateCustomer();

  // 2️⃣ When createCustomerMutation succeeds, move to step 2
  useEffect(() => {
    if (createCustomerMutation.isSuccess) {
      setStep(2);
    }
  }, [createCustomerMutation.isSuccess]);

  // Helpers
  const handleNext = () => {
    if (!user?.billingInfo) {
      createCustomerMutation.mutate();
    } else {
      setStep(2);
    }
  };

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
