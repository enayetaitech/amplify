"use client";

import React from "react";

import { Minus, Plus } from "lucide-react";
import { Label } from "components/ui/label";
import CustomButton from "components/shared/CustomButton";
import { Input } from "components/ui/input";

export interface RatingScaleQuestionProps {
  // id: string;
  scoreFrom: number;
  scoreTo: number;
  lowLabel: string;
  highLabel: string;
  onScoreFromChange: (newFrom: number) => void;
  onScoreToChange: (newTo: number) => void;
  onLowLabelChange: (value: string) => void;
  onHighLabelChange: (value: string) => void;
}

const RatingScaleQuestion: React.FC<RatingScaleQuestionProps> = ({
  // id,
  scoreFrom,
  scoreTo,
  lowLabel,
  highLabel,
  onScoreFromChange,
  onScoreToChange,
  onLowLabelChange,
  onHighLabelChange,
}) => (
  <div className="space-y-4">
    {/* 1) Score from / to */}
    <div className="grid grid-cols-2 gap-6">
      <div className="flex items-center gap-2">
        <Label>Score from</Label>
        <CustomButton
          icon={<Minus />}
          variant="ghost"
          size="icon"
          onClick={() => onScoreFromChange(Math.max(0, scoreFrom - 1))}
        />
        <span className="w-6 text-center">{scoreFrom}</span>
        <CustomButton
          icon={<Plus />}
          variant="ghost"
          size="icon"
          onClick={() => onScoreFromChange(scoreFrom + 1)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label>to</Label>
        <CustomButton
          icon={<Minus />}
          variant="ghost"
          size="icon"
          onClick={() => onScoreToChange(Math.max(scoreFrom, scoreTo - 1))}
        />
        <span className="w-6 text-center">{scoreTo}</span>
        <CustomButton
          icon={<Plus />}
          variant="ghost"
          size="icon"
          onClick={() => onScoreToChange(scoreTo + 1)}
        />
      </div>
    </div>

    {/* 2) Low / High labels */}
    <div className="grid grid-cols-2 gap-6">
      <div>
        <Label>Low score label</Label>
        <Input
          value={lowLabel}
          onChange={(e) => onLowLabelChange(e.target.value)}
          placeholder="e.g. Not likely"
          className="mt-1"
        />
      </div>
      <div>
        <Label>High score label</Label>
        <Input
          value={highLabel}
          onChange={(e) => onHighLabelChange(e.target.value)}
          placeholder="e.g. Extremely likely"
          className="mt-1"
        />
      </div>
    </div>
  </div>
);

export default RatingScaleQuestion;
