"use client";
import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "components/ui/select";
import PaymentIntegration from "./PaymentIntegrationComponent";
import { creditPackages, durationMapping, quantityOptions } from "constant";
import { IProjectFormState, Step4Props } from "@shared/interface/CreateProjectInterface";


const Step4: React.FC<Step4Props> = ({ formData, uniqueId }) => {
  // State to determine whether to show the payment integration UI
  const [showPaymentIntegration, setShowPaymentIntegration] = useState(false);

  // State to hold the quantities of each credit package selected by the user
  const [purchaseQuantities, setPurchaseQuantities] = useState<{ [key: number]: number }>({
    500: 0,
    2500: 0,
    15000: 0,
    50000: 0,
  });

  // Compute the project estimate rows based on sessions data
  const sessions = formData.sessions || [];
 
  // First, build the estimate rows
const projectEstimateRows = sessions.map((session) => {
  const quantity = Number(session.number) || 0;
  const sessionDuration = durationMapping[session.duration] || Number(session.duration) || 0;
  const estimatedHours = (quantity * sessionDuration) / 60;
  const creditsNeeded = (quantity * sessionDuration) * 2.75;

  return {
    service: formData.service,
    quantity,
    sessionDuration,
    estimatedHours: estimatedHours.toFixed(2),
    creditsNeeded: creditsNeeded.toFixed(2),
  };
});

// Then calculate total from them
const totalCreditsNeeded = projectEstimateRows.reduce(
  (acc, row) => acc + parseFloat(row.creditsNeeded),
  0
);

  // Handle changes to the quantity of a credit package
  const handleQuantityChange = (pkg: number, qty: number) => {
    setPurchaseQuantities((prev) => ({
      ...prev,
      [pkg]: qty,
    }));
  };

  // Calculate the total purchase price from selected credit packages
  const totalPurchasePrice = creditPackages.reduce((acc, pkg) => {
    const quantity = purchaseQuantities[pkg.package] || 0;
    return acc + quantity * pkg.cost;
  }, 0);

   // *** NEW *** Calculate the total credits based on the Purchase Credits table selection.
   const totalPurchasedCredits = creditPackages.reduce((acc, pkg) => {
    const quantity = purchaseQuantities[pkg.package] || 0;
    return acc + quantity * pkg.package;
  }, 0);

  // When Pay Now is clicked, switch to the Payment Integration UI
  const handlePayNow = () => {
    setShowPaymentIntegration(true);
  };

  // Render the PaymentIntegration component if the user has clicked "Pay Now"
  if (showPaymentIntegration) {
    return <PaymentIntegration totalPurchasePrice={totalPurchasePrice} 
    totalCreditsNeeded={totalPurchasedCredits}
    projectData={formData as IProjectFormState}
    uniqueId={uniqueId}
    />;
  }

  return (
    <div className="space-y-6 ml-20">
      <h1 className="text-3xl font-bold text-center">Project Review</h1>

      {/* Project Details */}
      <div className="border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Project Details</h2>
        <p>
          <span className="font-medium">Project Name: </span>
          {formData.name}
        </p>
        <p>
          <span className="font-medium">Service: </span>
          {formData.service}
        </p>
        <p>
          <span className="font-medium">Respondent Country: </span>
          {formData.respondentCountry}
        </p>
        <p>
          <span className="font-medium">Respondent Language: </span>
          {Array.isArray(formData.respondentLanguage)
            ? formData.respondentLanguage.join(", ")
            : formData.respondentLanguage}
        </p>
      </div>

      {/* Project Estimate Table */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Project Estimate</h2>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-4 py-2">Service</th>
              <th className="border px-4 py-2">Quantity</th>
              <th className="border px-4 py-2">Session Duration (mins)</th>
              <th className="border px-4 py-2">Estimated Hours</th>
              <th className="border px-4 py-2">Total Credit Needed</th>
            </tr>
          </thead>
          <tbody>
            {projectEstimateRows.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-4 py-2 text-center">{row.service}</td>
                <td className="border px-4 py-2 text-center">{row.quantity}</td>
                <td className="border px-4 py-2 text-center">{row.sessionDuration}</td>
                <td className="border px-4 py-2 text-center">{row.estimatedHours}</td>
                <td className="border px-4 py-2 text-center">{row.creditsNeeded}</td>
              </tr>
            ))}
            <tr>
              <td className="border px-4 py-2 font-bold text-right" colSpan={4}>
                Total Credits Needed
              </td>
              <td className="border px-4 py-2 text-center font-bold">
                {totalCreditsNeeded.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Available Credits */}
      <div className="border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Available Credits</h2>
        <p className="text-2xl">0</p>
      </div>

      {/* Purchase Credits Table */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Purchase Credits</h2>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-4 py-2">Quantity</th>
              <th className="border px-4 py-2">Credit Package</th>
              <th className="border px-4 py-2">Cost</th>
              <th className="border px-4 py-2">Total Price (USD)</th>
            </tr>
          </thead>
          <tbody>
            {creditPackages.map((pkg) => {
              const quantity = purchaseQuantities[pkg.package] || 0;
              const totalPrice = quantity * pkg.cost;
              return (
                <tr key={pkg.package}>
                  <td className="border px-4 py-2 text-center">
                    <Select
                      value={quantity ? quantity.toString() : ""}
                      onValueChange={(val) =>
                        handleQuantityChange(pkg.package, Number(val))
                      }
                    >
                      <SelectTrigger className="w-20">
                        <span>{quantity || "Select"}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {quantityOptions.map((q) => (
                          <SelectItem key={q} value={q.toString()}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border px-4 py-2 text-center">{pkg.package}</td>
                  <td className="border px-4 py-2 text-center">{pkg.cost}</td>
                  <td className="border px-4 py-2 text-center">{totalPrice}</td>
                </tr>
              );
            })}
            <tr>
              <td className="border px-4 py-2 font-bold text-right" colSpan={3}>
                Total Price (USD)
              </td>
              <td className="border px-4 py-2 text-center font-bold">
                {totalPurchasePrice}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Terms and Conditions</h2>
        <p className="text-sm">
          Credits purchased are tied to your account and can be used for any project you create. You
          can add credits at any time. <br />
          Signature Service will be billed based on actual streaming time and will be charged in
          15-minute increments. <br />
          Concierge Service is billed based on scheduled sessions. You may reschedule or modify a
          session up to three business days in advance without penalty. Cancellations, changes, or no-shows
          within three business days of any session will be charged the full time of the original scheduled
          session, along with any additional time required for rescheduling. Sessions will be charged in
          15-minute increments. <br />
          If you exceed your pre-paid credits—including time overages and/or scheduling changes—you will be
          billed at a rate of $175 per 100 credits, billed in 100 credit increments to replenish your account.
          These credits will be automatically charged to your credit card on file on the day the usage is
          incurred.
        </p>
      </div>

      {/* Pay Now Button */}
      <div className="text-center">
        <Button onClick={handlePayNow}>Pay Now</Button>
      </div>
    </div>
  );
};

export default Step4;
