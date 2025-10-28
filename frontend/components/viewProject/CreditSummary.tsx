"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { IProject } from "@shared/interface/ProjectInterface";
import { calculateOriginalEstimatedProjectCredits } from "utils/calculateOriginalEstimatedProjectCredits";
import { useRouter } from "next/navigation";
import CustomButton from "components/shared/CustomButton";
import { calculateRemainingScheduleCredits } from "utils/calculateCreditsNeededForRemainingSchedules";

interface CreditSummaryProps {
  project: IProject;
}

export default function CreditSummary({ project }: CreditSummaryProps) {
  const router = useRouter();

  const originalEstimateCreditSummary =
    calculateOriginalEstimatedProjectCredits(project.sessions);

  const creditNeededForRemainingSessions = calculateRemainingScheduleCredits(
    project.meetings
  );

  const usedToDate = project.cumulativeMinutes * 2.75; // 2.75 credits per minute

  const newTotal = usedToDate + creditNeededForRemainingSessions;

  const rows: Array<{ label: string; value: number | string }> = [
    {
      label: "Original Estimated Project Credits",
      value: originalEstimateCreditSummary,
    },
    { label: "Project Credits Used to Date", value: usedToDate },
    {
      label: "Project Credits Needed for Remaining Schedule",
      value: creditNeededForRemainingSessions,
    },
    { label: "New Total Project Credit Estimate", value: newTotal },
  ];
  return (
    <Card className="border-0 shadow-all-sides">
      <CardHeader>
        <CardTitle className="text-custom-teal">Credit Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-sm text-gray-600">{label}:</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}

        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-2">
            Need more credits or want to check your account balance?
          </p>
          <div className="flex justify-end">
            <CustomButton
              className="
      bg-gradient-to-r from-[#E29C4D] to-[rgb(234,185,94)] text-white px-3 py-2.5  
      rounded-2xl
    "
              onClick={() => {
                router.push("/billing");
              }}
            >
              View Credits
            </CustomButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
