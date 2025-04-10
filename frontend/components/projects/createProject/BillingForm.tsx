// /components/BillingForm.tsx
"use client";
import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { getToken, getUser } from "../../../utils/payment";

// Shared interface for billing information
export interface IBillingInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface BillingFormProps {
  onSuccess: () => void;
}

export const BillingForm: React.FC<BillingFormProps> = ({ onSuccess }) => {
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("pending");
    const token = getToken();
    try {
      const user = getUser();
      if (!user) throw new Error("User not found");
      // Save billing info on the backend
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/save-billing-info`,
        { userId: user._id, billingInfo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Billing info saved successfully");
      setStatus("success");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error saving billing info");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md">
      <h2 className="text-lg font-semibold">Billing Information</h2>
      <div className="flex flex-col">
        <Label>Address</Label>
        <input
          type="text"
          value={billingInfo.address}
          onChange={(e) =>
            setBillingInfo((prev) => ({ ...prev, address: e.target.value }))
          }
          required
          className="input"
        />
      </div>
      <div className="flex flex-col">
        <Label>City</Label>
        <input
          type="text"
          value={billingInfo.city}
          onChange={(e) =>
            setBillingInfo((prev) => ({ ...prev, city: e.target.value }))
          }
          required
          className="input"
        />
      </div>
      <div className="flex flex-col">
        <Label>State</Label>
        <input
          type="text"
          value={billingInfo.state}
          onChange={(e) =>
            setBillingInfo((prev) => ({ ...prev, state: e.target.value }))
          }
          required
          className="input"
        />
      </div>
      <div className="flex flex-col">
        <Label>Country</Label>
        <input
          type="text"
          value={billingInfo.country}
          onChange={(e) =>
            setBillingInfo((prev) => ({ ...prev, country: e.target.value }))
          }
          required
          className="input"
        />
      </div>
      <div className="flex flex-col">
        <Label>Postal Code</Label>
        <input
          type="text"
          value={billingInfo.postalCode}
          onChange={(e) =>
            setBillingInfo((prev) => ({ ...prev, postalCode: e.target.value }))
          }
          required
          className="input"
        />
      </div>
      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Saving..." : "Save Billing Info"}
      </Button>
    </form>
  );
};

export default BillingForm;
