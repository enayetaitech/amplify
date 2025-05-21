"use client";
import React, { useState } from "react";
import { creditPackages } from "constant";
import {
  IProjectFormState,
  Step4Props,
} from "@shared/interface/CreateProjectInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import PurchaseModal from "./PurchaseModal";
import { ProjectDetails } from "./step4Component/ProjectDetails";
import { TermsAndConditions } from "./step4Component/TermsAndConditions";
import { PurchaseCreditsTable } from "./step4Component/PurchaseCreditsTable";
import { ProjectEstimateTable } from "./step4Component/ProjectEstimateTable";



const Step4: React.FC<Step4Props> = ({ formData, uniqueId }) => {
  const [purchaseQuantities, setPurchaseQuantities] = useState<{
    [key: number]: number;
  }>({
    500: 0,
    2500: 0,
    15000: 0,
    50000: 0,
  });


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
          <ProjectDetails
      data={formData}
      />

  <ProjectEstimateTable sessions={formData.sessions} service={formData.service} />
     

      {/* Available Credits */}
      <div className="">
        <h2 className="text-xl font-semibold ">Available Credits: 0</h2>
      </div>

      {/* Purchase Credits Table */}
   
        <PurchaseCreditsTable
          purchaseQuantities={purchaseQuantities}
          onChange={handleQuantityChange}
          totalPrice={totalPurchasePrice}
        />

      {/* Terms and Conditions */}
   
      <TermsAndConditions/>

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
