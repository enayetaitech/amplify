// components/createAccount/CountrySelector.tsx
"use client";

import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "lib/utils";
import { CountryCode } from "hooks/useCountryList";

interface CountrySelectorProps {
  countries: CountryCode[];
  isLoading: boolean;
  selectedCountry: CountryCode | null;
  onSelect: (c: CountryCode) => void;
}

export default function CountrySelector({
  countries,
  isLoading,
  selectedCountry,
  onSelect,
}: CountrySelectorProps) {
  // Local state to control popover visibility
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isLoading}
          className="w-32 justify-between border-none"
        >
          {selectedCountry ? (
            <div className="flex items-center">
              <span className="mr-1">{selectedCountry.iso}</span>
              <span>+{selectedCountry.code}</span>
            </div>
          ) : (
            "Select country"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0 border-0">
        <Command>
          <CommandInput placeholder="Search country or code…" />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {countries.map((country) => (
              <CommandItem
                key={country.iso}
                value={`${country.country} ${country.code} ${country.iso}`}
                onSelect={() => {
                  onSelect(country);
                  setOpen(false); // close popover after selecting
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCountry?.iso === country.iso ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex justify-between w-full">
                  <span>{country.country}</span>
                  <span className="text-gray-500">+{country.code}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
