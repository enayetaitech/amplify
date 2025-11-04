"use client";

import React from "react";
import CustomButton from "components/shared/CustomButton";

export interface FillInBlankQuestionProps {
  // id: string;
  onAddBlank: () => void;
  disabled?: boolean;
}

const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  // id,
  onAddBlank,
  disabled
}) => (
  <div className="space-y-4">
    {/* + Add Blank button */}
    <div>
      <CustomButton
        text="+ Add Blank"
        variant="outline"
        size="sm"
        onClick={onAddBlank}
        disabled={disabled}
      />
    </div>
  </div>
);

export default FillInBlankQuestion;
