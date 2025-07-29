// /components/BillingForm.tsx
"use client";
import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import { IBillingInfo } from "@shared/interface/UserInterface";
import { BillingFormProps } from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "context/GlobalContext";
import { Input } from "components/ui/input";
import { Card, CardContent } from "components/ui/card";
import { useSaveBilling } from "hooks/useSaveBilling";
import { makeOnChange } from "utils/validationHelper";
import {
  alphanumericSingleSpace,
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  onlyDigits,
} from "schemas/validators";

const fieldLabels: Record<keyof IBillingInfo, string> = {
  address: "Street Address",
  postalCode: "Zip Code",
  city: "City",
  state: "State",
  country: "Country",
};

export const BillingForm: React.FC<BillingFormProps> = ({ onSuccess }) => {
  const { user } = useGlobalContext();
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const saveBilling = useSaveBilling(() => {
    onSuccess();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = user?._id;
    if (!userId) return;

    saveBilling.mutate({ userId, billingInfo });
  };

  const isSaving = saveBilling.isPending;


  return (
    <Card className="border-0 shadow-sm py-0">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Billing Details</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full-width Street Address */}
          <div className="flex flex-col">
            <Label htmlFor="address" className="mb-1">
              {fieldLabels.address} *
            </Label>
            <Input
              id="address"
              placeholder="Enter Street Address"
              value={billingInfo.address}
              disabled={isSaving}
              onChange={makeOnChange(
                "address",
                [noLeadingSpace, noMultipleSpaces, alphanumericSingleSpace],
                "Only letters, numbers, and single spaces are allowed.",
                (upd) =>
                  setBillingInfo((prev) => ({
                    ...prev,
                    ...upd,
                  }))
              )}
              required
            />
          </div>

          {/* Three-column Zip / City / State */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                field: "postalCode" as const,
                label: fieldLabels.postalCode,
                validators: [noLeadingSpace, noMultipleSpaces, onlyDigits],
                err: "Only digits allowed (no spaces or special chars).",
              },
              {
                field: "city" as const,
                label: fieldLabels.city,
                validators: [
                  noLeadingSpace,
                  noMultipleSpaces,
                  lettersAndSpaces,
                ],
                err: "Only letters & single spaces allowed.",
              },
              {
                field: "state" as const,
                label: fieldLabels.state,
                validators: [
                  noLeadingSpace,
                  noMultipleSpaces,
                  lettersAndSpaces,
                ],
                err: "Only letters & single spaces allowed.",
              },
            ].map(({ field, label, validators, err }) => (
              <div key={field} className="flex flex-col">
                <Label htmlFor={field} className="mb-1">
                  {label} *
                </Label>
                <Input
                  id={field}
                  placeholder={`Enter ${label}`}
                  value={billingInfo[field]}
                  disabled={isSaving}
                  onChange={makeOnChange(field, validators, err, (upd) =>
                    setBillingInfo((prev) => ({
                      ...prev,
                      ...upd,
                    }))
                  )}
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <Label htmlFor="country" className="mb-1">
              {fieldLabels.country} *
            </Label>
            <Input
              id="country"
              placeholder="Enter Country"
              value={billingInfo.country}
              disabled={isSaving}
              onChange={makeOnChange(
                "country",
                [noLeadingSpace, noMultipleSpaces, lettersAndSpaces],
                "Only letters & single spaces allowed.",
                (upd) =>
                  setBillingInfo((prev) => ({
                    ...prev,
                    ...upd,
                  }))
              )}
              required
            />
          </div>
          {/* Next button centered */}
          <div className="text-center">
            <Button
              type="submit"
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Billing Info"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillingForm;
