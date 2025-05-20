import React, { useEffect, useRef, useState } from "react";
import { IModerator } from "@shared/interface/ModeratorInterface";

interface MultiSelectDropdownProps {
  moderators: IModerator[];
  selected: string[];
  onChange: (selectedIds: string[]) => void;
   disabled?: boolean; 
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  moderators,
  selected,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((sid) => sid !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  const selectedCount = selected.length;
  const displayText =
    selectedCount > 0
      ? `${selectedCount} moderator${selectedCount > 1 ? "s" : ""} selected`
      : "Select moderators";

  return (
    <div className="relative w-full min-w-[250px]" ref={dropdownRef}>
      <div
       onClick={() => !disabled && setIsOpen((prev) => !prev)}
         className={
          "border border-gray-300 rounded px-3 py-2 text-sm " +
          (disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white cursor-pointer")
        }
      >
        {displayText}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-20 w-full bg-white border rounded shadow max-h-60 overflow-y-auto mt-1">
          {moderators.map((mod) => {
            const isChecked = selected.includes(mod._id!);
            return (
              <div
                key={mod._id}
                onClick={() => toggleSelect(mod._id!)}
                className={`flex items-center px-3 py-2 cursor-pointer text-xs ${
                  isChecked ? "bg-blue-50" : ""
                }`}
              >
                {/* Custom checkbox */}
                <div
                  className={`mr-2 w-4 h-4   flex items-center justify-center ${
                    isChecked ? "bg-custom-orange-1" : "bg-white"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {mod.firstName} {mod.lastName}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
