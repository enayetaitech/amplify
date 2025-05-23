"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";

export interface MultipleChoiceQuestionProps {
  id: string;
  answers: string[];
  correctAnswers: number[];
  onAnswerChange: (index: number, value: string) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  onToggleCorrectAnswer: (index: number, checked: boolean) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  id,
  answers,
  correctAnswers,
  onAnswerChange,
  onAddChoice,
  onRemoveChoice,
  onToggleCorrectAnswer,
}) => {
  return (
    <div className="space-y-4">
      {answers.map((ans, i) => (
        <div key={i} className="relative group flex items-center space-x-2">
          <input
            type="checkbox"
            name={`correct-${id}-${i}`}
            checked={correctAnswers.includes(i)}
            onChange={(e) => onToggleCorrectAnswer(i, e.target.checked)}
            className="cursor-pointer"
          />

          <Input
            value={ans}
            onChange={(e) => onAnswerChange(i, e.target.value)}
            placeholder={`Enter choice ${i + 1}`}
            className="pr-10 flex-1"
          />

          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveChoice(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"
          />
        </div>
      ))}

      <CustomButton
        text="+ Add Choice"
        variant="outline"
        size="sm"
        onClick={onAddChoice}
      />
    </div>
  );
};

export default MultipleChoiceQuestion;
