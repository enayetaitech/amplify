// components/polls/SingleChoiceQuestion.tsx
"use client";

import React from "react";

import { Trash2 } from "lucide-react";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";
import { Switch } from "@/components/ui/switch";

export interface SingleChoiceQuestionProps {
  id: string;
  answers: string[];
  correctAnswer: number;
  showDropdown: boolean;
  onAnswerChange: (index: number, value: string) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  onToggleShowDropdown: (show: boolean) => void;
  onCorrectAnswerChange: (index: number) => void;
  disabled?: boolean;
}

const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  id,
  answers,
  correctAnswer,
  showDropdown,
  onAnswerChange,
  onAddChoice,
  onRemoveChoice,
  onToggleShowDropdown,
  onCorrectAnswerChange,
  disabled
}) => (
  <div className="space-y-4">
    {answers.map((ans, i) => (
      <div
        key={i}
        className="relative group flex items-center space-x-2"
      >
        <input
          type="radio"
          name={`correct-${id}`}
          checked={correctAnswer === i}
          onChange={() => onCorrectAnswerChange(i)}
          className="cursor-pointer"
          disabled={disabled}
        />

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
          className="absolute right-2 top-1/2 -translate-y-1/2
                     opacity-0 group-focus-within:opacity-100
                     transition-opacity"
                     disabled={disabled}
        />
      </div>
    ))}

    <div className="flex items-center gap-2">
      <Switch
        checked={showDropdown}
        onCheckedChange={(v) => onToggleShowDropdown(v)}
        disabled={disabled}
      />
      <span>Show dropdown</span>
    </div>

    <CustomButton
      text="+ Add Choice"
      variant="outline"
      size="sm"
      onClick={onAddChoice}
      disabled={disabled}
    />
  </div>
);

export default SingleChoiceQuestion;
