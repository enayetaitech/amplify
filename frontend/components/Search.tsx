"use client";

import React, { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "components/ui/input";
import { cn } from "lib/utils";

interface SearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  inputClassName?: string;
  iconClassName?: string;
}

const Search = ({
  placeholder = "Search...",
  onSearch,
  inputClassName,
  iconClassName,
}: SearchProps) => {
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchInput);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchInput, onSearch]);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className={cn("pl-10", inputClassName)}
      />
      <div
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",
          iconClassName
        )}
      >
        <SearchIcon className="h-4 w-4" />
      </div>
    </div>
  );
};

export default Search;
