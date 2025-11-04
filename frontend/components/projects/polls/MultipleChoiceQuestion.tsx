"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";

export interface MultipleChoiceQuestionProps {
  id: string;
  answers: string[];
  onAnswerChange: (index: number, value: string) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  disabled?: boolean;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  id,
  answers,
  onAnswerChange,
  onAddChoice,
  onRemoveChoice,
  disabled
}) => {
  void id;  
  return (
    <div className="space-y-4">
      {answers.map((ans, i) => (
        <div key={i} className="relative group flex items-center space-x-2">
          <Input
            value={ans}
            onChange={(e) => onAnswerChange(i, e.target.value)}
            placeholder={`Enter choice ${i + 1}`}
            className="pr-10 flex-1"
              disabled={disabled}
          />

          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveChoice(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"
              disabled={disabled}
          />
        </div>
      ))}

      <CustomButton
        text="+ Add Choice"
        variant="outline"
        size="sm"
        onClick={onAddChoice}
          disabled={disabled}
      />
    </div>
  );
};

export default MultipleChoiceQuestion;
