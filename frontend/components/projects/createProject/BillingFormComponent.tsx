// /components/BillingForm.tsx
"use client";
import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { IBillingInfo } from "@shared/interface/UserInterface";
import { BillingFormProps } from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "context/GlobalContext";
import { Input } from "components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import api from "lib/api";

export const BillingForm: React.FC<BillingFormProps> = ({ onSuccess }) => {
  const { user } = useGlobalContext();
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

 
  const saveBilling = useMutation<
  ApiResponse<null>,
  AxiosError<ErrorResponse>,
  IBillingInfo
>({
  mutationFn: (info) =>
    api
      .post<ApiResponse<null>>(
        "/api/v1/payment/save-billing-info",
        { userId: user?._id, billingInfo: info }
      )
      .then((res) => res.data),

  onSuccess: () => {
    toast.success("Billing info saved successfully");
    onSuccess();
  },

  onError: (err) => {
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.message ?? err.message
      : "Error saving billing info";
    toast.error(msg);
  },
});

  const handleChange = (key: keyof IBillingInfo, value: string) => {
    setBillingInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBilling.mutate(billingInfo);
  };

  return (
   
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-4 rounded-md"
    >
      <h2 className="text-lg font-semibold">Billing Information</h2>

      {(
        ["address", "city", "state", "country", "postalCode"] as Array<
          keyof IBillingInfo
        >
      ).map((field) => (
        <div key={field} className="flex flex-col">
          <Label className="mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
          <Input
            value={billingInfo[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            required
          />
        </div>
      ))}

      <Button type="submit" disabled={saveBilling.isPending} className="mt-2">
        {saveBilling.isPending ? "Saving..." : "Save Billing Info"}
      </Button>
    </form>
  );
};

export default BillingForm;
