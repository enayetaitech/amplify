"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";

export interface MatchingQuestionProps {
  // id: string;
  options: string[];
  answers: string[];
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onAnswerChange: (index: number, value: string) => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (index: number) => void;
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  // id,
  options,
  answers,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onAnswerChange,
  onAddAnswer,
  onRemoveAnswer,
}) => (
  <div className="grid grid-cols-2 gap-6">
    {/* Left column: Options */}
    <div className="space-y-4">
      <Label>Options</Label>
      {options.map((opt, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {String.fromCharCode(65 + i)}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={opt}
            placeholder={`Option ${i + 1}`}
            onChange={(e) => onOptionChange(i, e.target.value)}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveOption(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       opacity-0 group-focus-within:opacity-100 transition-opacity"
          />
        </div>
      ))}
      <CustomButton
        text="+ Add Option"
        variant="outline"
        size="sm"
        onClick={onAddOption}
      />
    </div>

    {/* Right column: Answers */}
    <div className="space-y-4">
      <Label>Answers</Label>
      {answers.map((ans, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {i + 1}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={ans}
            placeholder={`Answer ${i + 1}`}
            onChange={(e) => onAnswerChange(i, e.target.value)}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveAnswer(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2
                       opacity-0 group-focus-within:opacity-100 transition-opacity"
          />
        </div>
      ))}
      <CustomButton
        text="+ Add Answer"
        variant="outline"
        size="sm"
        onClick={onAddAnswer}
      />
    </div>
  </div>
);

export default MatchingQuestion;
