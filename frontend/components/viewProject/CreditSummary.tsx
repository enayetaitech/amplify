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
  console.log("project", project);
  const router = useRouter();

  const originalEstimateCreditSummary =
    calculateOriginalEstimatedProjectCredits(project.sessions);

  const creditNeededForRemainingSessions = calculateRemainingScheduleCredits(
    project.meetings
  );

  return (
    <Card className="border-0 shadow-all-sides">
      <CardHeader>
        <CardTitle className="text-custom-teal">Credit Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Original Estimated Project Credits:
          </span>
          <span className="font-medium">{originalEstimateCreditSummary}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Project Credits Used to Date:
          </span>
          <span className="font-medium">{project.cumulativeMinutes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Project Credits Needed for Remaining Schedule:
          </span>
          <span className="font-medium">
            {creditNeededForRemainingSessions}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            New Total Project Credit Estimate:
          </span>
          <span className="font-medium">
            {project.cumulativeMinutes + creditNeededForRemainingSessions}
          </span>
        </div>

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
