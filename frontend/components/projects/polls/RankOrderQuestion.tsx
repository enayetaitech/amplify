"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";

export interface RankOrderQuestionProps {
  // id: string;
  rows: string[];
  columns: string[];
  onRowChange: (index: number, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onColumnChange: (index: number, value: string) => void;
  onAddColumn: () => void;
  onRemoveColumn: (index: number) => void;
  disabled?: boolean;
}

const RankOrderQuestion: React.FC<RankOrderQuestionProps> = ({
  // id,
  rows,
  columns,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onColumnChange,
  onAddColumn,
  onRemoveColumn,
  disabled
}) => (
  <div className="grid grid-cols-2 gap-6">
    <div className="space-y-4">
      <Label>Rows</Label>
      {rows.map((row, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {i + 1}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={row}
            placeholder={`Row ${i + 1}`}
            onChange={(e) => onRowChange(i, e.target.value)}
              disabled={disabled}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveRow(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"
              disabled={disabled}
          />
        </div>
      ))}
      <CustomButton
        text="+ Add row"
        variant="outline"
        size="sm"
        onClick={onAddRow}
          disabled={disabled}
      />
    </div>

    <div className="space-y-4">
      <Label>Columns</Label>
      {columns.map((col, i) => (
        <div key={i} className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {i + 1}.
          </span>
          <Input
            className="pl-8 pr-10 mt-1"
            value={col}
            placeholder={`Column ${i + 1}`}
            onChange={(e) => onColumnChange(i, e.target.value)}
              disabled={disabled}
          />
          <CustomButton
            icon={<Trash2 />}
            variant="ghost"
            size="icon"
            onClick={() => onRemoveColumn(i)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"
              disabled={disabled}
          />
        </div>
      ))}
      <CustomButton
        text="+ Add column"
        variant="outline"
        size="sm"
        onClick={onAddColumn}
          disabled={disabled}
      />
    </div>
  </div>
);

export default RankOrderQuestion;
