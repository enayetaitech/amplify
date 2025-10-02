"use client";

import React from "react";
import { Button } from "components/ui/button";
import { Switch } from "components/ui/switch";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  PenTool,
  Eraser,
  Square,
  Circle,
  Type,
  Lock,
  Unlock,
  ArrowLeft,
  ArrowRight,
  Trash,
  Download,
} from "lucide-react";

type Tool = "pencil" | "eraser" | "line" | "rect" | "circle" | "text";

export default function WhiteboardToolbar({
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  onUndo,
  onRedo,
  onClear,
  locked,
  onToggleLock,
  onExport,
  canLock,
  disabled,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  size: number;
  setSize: (s: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  locked: boolean;
  onToggleLock: (l: boolean) => void;
  onExport?: () => void;
  canLock: boolean; // moderator/admin
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={disabled}
        variant={tool === "pencil" ? "secondary" : "ghost"}
        onClick={() => setTool("pencil")}
      >
        <PenTool className="h-4 w-4" />
      </Button>
      <Button
        disabled={disabled}
        variant={tool === "eraser" ? "secondary" : "ghost"}
        onClick={() => setTool("eraser")}
      >
        <Eraser className="h-4 w-4" />
      </Button>
      <Button
        disabled={disabled}
        variant={tool === "line" ? "secondary" : "ghost"}
        onClick={() => setTool("line")}
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        disabled={disabled}
        variant={tool === "rect" ? "secondary" : "ghost"}
        onClick={() => setTool("rect")}
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        disabled={disabled}
        variant={tool === "circle" ? "secondary" : "ghost"}
        onClick={() => setTool("circle")}
      >
        <Circle className="h-4 w-4" />
      </Button>
      <Button
        disabled={disabled}
        variant={tool === "text" ? "secondary" : "ghost"}
        onClick={() => setTool("text")}
      >
        <Type className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 ml-2">
        <Label className="text-xs">Color</Label>
        <Input
          type="color"
          value={color}
          onChange={(e) => !disabled && setColor(e.target.value)}
          className="w-10 h-8 p-0"
          disabled={disabled}
        />
      </div>

      <div className="flex items-center gap-1">
        <Label className="text-xs">Size</Label>
        <input
          type="range"
          min={1}
          max={40}
          value={size}
          onChange={(e) => !disabled && setSize(Number(e.target.value))}
          className="w-28"
          disabled={disabled}
        />
      </div>

      <Button onClick={onUndo} disabled={disabled}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button onClick={onRedo} disabled={disabled}>
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button onClick={onClear} disabled={disabled}>
        <Trash className="h-4 w-4" />
      </Button>
      <Button onClick={() => onExport?.()} disabled={disabled}>
        <Download className="h-4 w-4" />
      </Button>

      {canLock && (
        <div className="flex items-center gap-1 ml-2">
          <Label className="text-xs">Lock</Label>
          <Switch
            checked={locked}
            onCheckedChange={(v) => onToggleLock(Boolean(v))}
            disabled={disabled}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </Switch>
        </div>
      )}
    </div>
  );
}
