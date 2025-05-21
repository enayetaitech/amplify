"use client";
import React, { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { creditPackages, durationMapping, quantityOptions } from "constant";
import {
  IProjectFormState,
  Step4Props,
} from "@shared/interface/CreateProjectInterface";
import { Card, CardContent } from "components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import ComponentContainer from "components/shared/ComponentContainer";
import PurchaseModal from "./PurchaseModal";

const Step4: React.FC<Step4Props> = ({ formData, uniqueId }) => {
  const [purchaseQuantities, setPurchaseQuantities] = useState<{
    [key: number]: number;
  }>({
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
    const sessionDuration =
      durationMapping[session.duration] || Number(session.duration) || 0;
    const estimatedHours = (quantity * sessionDuration) / 60;
    const creditsNeeded = quantity * sessionDuration * 2.75;

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



  return (
   <ComponentContainer>
     <div className="space-y-6 ml-28">
      {/* Project Details */}
      <div className=" ">
        <h2 className="text-xl font-semibold mb-2">Project Review</h2>
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
      <div className="">
        <h2 className="text-xl font-semibold mb-2">Project Estimate</h2>
        <Card className="border-0 shadow-md py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-custom-teal">
                  <TableHead className="pl-6 text-custom-teal">
                    Service
                  </TableHead>
                  <TableHead className="text-right text-custom-teal">
                    Quantity
                  </TableHead>
                  <TableHead className="text-right text-custom-teal">
                    Session Duration (mins)
                  </TableHead>
                  <TableHead className="text-right text-custom-teal">
                    Estimated Hours
                  </TableHead>
                  <TableHead className="text-right text-custom-teal">
                    Total Credits Needed
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectEstimateRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-6">{row.service}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell className="text-right">
                      {row.sessionDuration}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.estimatedHours}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.creditsNeeded}
                    </TableCell>
                  </TableRow>
                ))}

                {/* total row */}
                <TableRow className="font-semibold">
                  {/* colspan 3 to push the totals under the last two columns */}
                  <TableCell className="pl-6" colSpan={3}>
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right">
                    {projectEstimateRows
                      .reduce((sum, r) => sum + parseFloat(r.estimatedHours), 0)
                      .toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalCreditsNeeded.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="pt-5 text-sm">
          *Final billing will be based on actual streaming hours for sessions
          booked.
        </p>
      </div>

      {/* Available Credits */}
      <div className="">
        <h2 className="text-xl font-semibold ">Available Credits: 0</h2>
      </div>

      {/* Purchase Credits Table */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Purchase Credits</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-custom-teal">
                  <TableHead className="pl-6 text-custom-teal">
                    Quantity
                  </TableHead>
                  <TableHead className="text-right text-custom-teal">
                    Credit Package
                  </TableHead>
                  <TableHead className="text-right text-custom-teal">
                    Cost
                  </TableHead>
                  <TableHead className="text-right text-custom-teal">
                    Total Price (USD)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditPackages.map((pkg) => {
                  const quantity = purchaseQuantities[pkg.package] || 0;
                  const totalPrice = quantity * pkg.cost;
                  return (
                    <TableRow key={pkg.package}>
                      <TableCell className="pl-6">
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
                      </TableCell>
                      <TableCell className="text-right">
                        {pkg.package}
                      </TableCell>
                      <TableCell className="text-right">{pkg.cost}</TableCell>
                      <TableCell className="text-right">{totalPrice}</TableCell>
                    </TableRow>
                  );
                })}

                <TableRow className="font-semibold">
                  <TableCell colSpan={3} className="pl-6 text-right">
                    Total Price (USD)
                  </TableCell>
                  <TableCell className="text-right">
                    {totalPurchasePrice}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Terms and Conditions */}
      <div className="">
        <h2 className="text-xl font-semibold mb-2">Terms and Conditions</h2>
        <p className="text-sm">
          Credits purchased are tied to your account and can be used for any
          project you create. You can add credits at any time. Signature Service
          will be billed based on actual streaming time and will be charged in
          15-minute increments. Concierge Service is billed based on scheduled
          sessions. You may reschedule or modify a session up to three business
          days in advance without penalty. Cancellations, changes, or no-shows
          within three business days of any session will be charged the full
          time of the original scheduled session, along with any additional time
          required for rescheduling. Sessions will be charged in 15-minute
          increments. If you exceed your pre-paid credits—including time
          overages and/or scheduling changes—you will be billed at a rate of
          $175 per 100 credits, billed in 100 credit increments to replenish
          your account. These credits will be automatically charged to your
          credit card on file on the day the usage is incurred.
        </p>
      </div>

       {/* Pay Now Modal Trigger */}
 <div className="text-center mt-6">
  {uniqueId && (
  <PurchaseModal
    creditPackages={creditPackages}
    purchaseQuantities={purchaseQuantities}
    totalPurchasePrice={totalPurchasePrice}
    totalCreditsNeeded={totalPurchasedCredits}
    projectData={formData as IProjectFormState}
  />
)}

 </div>
    </div>
   </ComponentContainer>
  );
};

export default Step4;
