"use client";

import { memo } from "react";

type BreakoutOption = {
  key: string;
  label: string;
  url: string | null;
};

interface ObserverBreakoutSelectProps {
  options: BreakoutOption[];
  selected: string;
  setSelected: (value: string) => void;
  url: string | null;
}

function ObserverBreakoutSelect({
  options,
  selected,
  setSelected,
  url,
}: ObserverBreakoutSelectProps) {
  return (
    <div className="bg-custom-gray-2 rounded-lg p-2 flex-1 min-h-0 overflow-y-auto">
      <h3 className="font-semibold mb-2">Breakouts</h3>
      <label className="block text-sm mb-1">Choose a room</label>
      <select
        className="border rounded px-2 py-1 text-black w-full"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="text-xs text-gray-500 mt-2">
        {url ? "Streaming available" : "No live stream for this room"}
      </div>
    </div>
  );
}

export default memo(ObserverBreakoutSelect);
