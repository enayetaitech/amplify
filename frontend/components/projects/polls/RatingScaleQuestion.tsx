"use client";

import React from "react";

import { Minus, Plus } from "lucide-react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";

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
  disabled?: boolean;
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
  disabled,
}) => (
  <div className="space-y-4">
    {/* 1) Score from / to */}
    <div className="grid grid-cols-2 gap-6">
      <div className="flex items-center space-x-2">
        <Label className="whitespace-nowrap">Score from</Label>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onScoreFromChange(Math.max(0, scoreFrom - 1))}
            disabled={disabled}
          >
            <Minus />
          </Button>

          <span className="w-8 text-center">{scoreFrom}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onScoreFromChange(scoreFrom + 1)}
            disabled={disabled}
          >
            <Plus />{" "}
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
          <Label className="whitespace-nowrap">To</Label>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onScoreToChange(Math.max(scoreFrom, scoreTo - 1))}
              disabled={disabled}
            >
              <Minus />
            </Button>
            <span className="w-8 text-center">{scoreTo}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onScoreToChange(scoreTo + 1)}
              disabled={disabled}
            >
              <Plus />
            </Button>
          </div>
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
          disabled={disabled}
        />
      </div>
      <div>
        <Label>High score label</Label>
        <Input
          value={highLabel}
          onChange={(e) => onHighLabelChange(e.target.value)}
          placeholder="e.g. Extremely likely"
          className="mt-1"
          disabled={disabled}
        />
      </div>
    </div>
  </div>
);

export default RatingScaleQuestion;
