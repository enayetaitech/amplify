"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import CustomButton from "components/shared/CustomButton";
import { Label } from "@radix-ui/react-label";
import { Input } from "components/ui/input";

export interface FillInBlankQuestionProps {
  // id: string;
  answers: string[];
  onAddBlank: () => void;
  onAnswerChange: (index: number, value: string) => void;
  onRemoveAnswer: (index: number) => void;
  disabled?: boolean;
}

const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  // id,
  answers,
  onAddBlank,
  onAnswerChange,
  onRemoveAnswer,
  disabled
}) => (
  <div className="space-y-4">
    {/* 1) + Add Blank button */}
    <div>
      <CustomButton
        text="+ Add Blank"
        variant="outline"
        size="sm"
        onClick={onAddBlank}
          disabled={disabled}
      />
    </div>

    {/* 2) Answers for each <blank> */}
    <div className="space-y-2">
      <Label>Answers</Label>
      {answers.map((ans, idx) => (
        <div key={idx} className="relative group flex items-center space-x-2">
          {/* numbering */}
          <span className="text-gray-500">{idx + 1}.</span>

          {/* text input */}
          <Input
            value={ans}
            onChange={(e) => onAnswerChange(idx, e.target.value)}
            placeholder={`Answer ${idx + 1}`}
            className="pr-10 flex-1"
              disabled={disabled}
          />

          {/* delete blank-answer button */}
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveAnswer(idx)}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       opacity-0 group-focus-within:opacity-100 transition-opacity"
                         disabled={disabled}
          />
        </div>
      ))}

     
    </div>
  </div>
);

export default FillInBlankQuestion;
