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

  const handleChange = (key: keyof IBillingInfo, value: string) => {
    setBillingInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userId = user?._id;
    if (!userId) return;

    saveBilling.mutate({ userId, billingInfo });
  };

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
              onChange={(e) => handleChange("address", e.target.value)}
              required
            />
          </div>

          {/* Three-column Zip / City / State */}
          <div className="grid grid-cols-3 gap-4">
            {(["postalCode", "city", "state"] as (keyof IBillingInfo)[]).map(
              (field) => (
                <div key={field} className="flex flex-col">
                  <Label htmlFor={field} className="mb-1">
                    {fieldLabels[field]} *
                  </Label>
                  <Input
                    id={field}
                    placeholder={`Enter ${fieldLabels[field]}`}
                    value={billingInfo[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required
                  />
                </div>
              )
            )}
          </div>
          <div className="flex flex-col">
            <Label htmlFor="country" className="mb-1">
              {fieldLabels.country} *
            </Label>
            <Input
              id="country"
              placeholder="Enter Country"
              value={billingInfo.country}
              onChange={(e) => handleChange("country", e.target.value)}
              required
            />
          </div>
          {/* Next button centered */}
          <div className="text-center">
            <Button
              type="submit"
              className="bg-custom-teal hover:bg-custom-dark-blue-3"
              disabled={saveBilling.isPending}
            >
              {saveBilling.isPending ? "Saving..." : "Save Billing Info"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillingForm;
