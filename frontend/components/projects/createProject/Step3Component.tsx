"use client";

import React, { useState, useEffect } from "react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { CheckIcon } from "lucide-react";
import { SessionRow } from "@shared/interface/ProjectInterface";
import { ALPHA_REGEX, availableLanguages, durations } from "constant";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Step3Props } from "@shared/interface/CreateProjectInterface";
import { Tooltip, TooltipTrigger } from "components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { BiQuestionMark } from "react-icons/bi";
import SessionsTable from "./SessionsTable";



const Step3: React.FC<Step3Props> = ({ formData, updateFormData }) => {
  // ========= Respondent Languages =========
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    Array.isArray(formData.respondentLanguage)
      ? formData.respondentLanguage
      : formData.respondentLanguage
      ? [formData.respondentLanguage]
      : []
  );
  const [otherLanguage, setOtherLanguage] = useState<string>("");
  const [otherLangError,  setOtherLangError]  = useState<string>("");
  const [projectName, setProjectName] = useState<string>(formData.name || "");

  // ========= Respondent Country =========
  const isInitiallyOther =
    formData.respondentCountry && formData.respondentCountry !== "USA";
  const [countrySelection, setCountrySelection] = useState<"USA" | "Other">(
    isInitiallyOther ? "Other" : "USA"
  );
  const [otherCountry, setOtherCountry] = useState<string>(
    isInitiallyOther ? formData.respondentCountry : ""
  );
const [otherCountryError, setOtherCountryError] = useState<string>("");
  // ========= Sessions =========
  const [sessionRows, setSessionRows] = useState<SessionRow[]>(
    () =>
      formData.sessions?.map((s, i) => ({
        id: `${Date.now()}_${i}`,
        number: s.number,
        duration: s.duration,
      })) || [{ id: Date.now().toString(), number: 1, duration: durations[0] }]
  );

  // ========= Update Parent State =========
  useEffect(() => {
      if (selectedLanguages.includes("Other") && !validateOtherLanguage()) {
      return;
    }

    const computedLanguages = selectedLanguages.includes("Other")
      ? [
          ...selectedLanguages.filter((lang) => lang !== "Other"),
          ...(otherLanguage.trim() ? [otherLanguage.trim()] : []),
        ]
      : selectedLanguages;

       if (countrySelection === "Other" && !validateOtherCountry()) {
    return;
  }
  // if “Other Language” is invalid, skip too
  if (selectedLanguages.includes("Other") && !validateOtherLanguage()) {
    return;
  }
    const finalCountry =
      countrySelection === "USA" ? "USA" : otherCountry.trim();

    updateFormData({
      name: projectName,
      respondentLanguage: computedLanguages,
      respondentCountry: finalCountry,
      sessions: sessionRows.map((row) => ({
        number: row.number,
        duration: row.duration,
      })),
    });

    // Excluding updateFormData from dependencies to avoid potential infinite loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectName,
    selectedLanguages,
    otherLanguage,
    countrySelection,
    otherCountry,
    sessionRows,
  ]);

  // ========= Multi-Select Handlers =========
  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  // ========= Respondent Country Handlers =========
  const handleCountrySelection = (value: "USA" | "Other") => {
    setCountrySelection(value);
    if (value === "USA") {
      setOtherCountry("");
    }
  };

  const handleOtherCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherCountry(e.target.value);

     if (otherCountryError) {
    setOtherCountryError("");
  }
  };

   const handleOtherLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setOtherLanguage(v);

    // clear error as user types
    if (otherLangError) {
      setOtherLangError("");
    }
  };

  const validateOtherLanguage = () => {
    if (!otherLanguage.trim()) {
      setOtherLangError("Please enter a language.");
      return false;
    }
    if (!ALPHA_REGEX.test(otherLanguage.trim())) {
      setOtherLangError("Only letters and spaces are allowed.");
      return false;
    }
    setOtherLangError("");
    return true;
  };

  // Hook into your wizard’s “next” step button (if you have one) or 
  // run this on blur:
  const handleOtherLanguageBlur = () => {
    if (selectedLanguages.includes("Other")) {
      validateOtherLanguage();
    }
  };

const validateOtherCountry = () => {
  const trimmed = otherCountry.trim();
  if (!trimmed) {
    setOtherCountryError("Please enter a country.");
    return false;
  }
  if (!ALPHA_REGEX.test(trimmed)) {
    setOtherCountryError("Only letters and spaces are allowed.");
    return false;
  }
  setOtherCountryError("");
  return true;
};

const handleOtherCountryBlur = () => {
  if (countrySelection === "Other") {
    validateOtherCountry();
  }
}


  return (
    <div className="space-y-6">
      {/* Project Name Input */}
      <div>
        <Label className="text-sm font-medium">Project Name*</Label>
        <Input
          type="text"
          className="mt-1 w-full"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
      </div>
      {/* Multi-Select for Languages using Popover and Command */}
      <div>
        <Label className="text-sm font-medium">Respondent Language(s)*</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full text-left">
              {selectedLanguages.length > 0
                ? selectedLanguages.join(", ")
                : "Select languages"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search languages..." />
              <CommandList>
                {availableLanguages.map((lang) => (
                  <CommandItem
                    key={lang}
                    onSelect={() => toggleLanguage(lang)}
                    className="cursor-pointer flex items-center"
                  >
                    {selectedLanguages.includes(lang) && (
                      <CheckIcon className="mr-2 h-4 w-4" />
                    )}
                    {lang}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {selectedLanguages.includes("Other") && (
          <div className="mt-2">
            <Label className="text-sm font-medium">Other Language(s)*</Label>
            <Input
              type="text"
              className="mt-1 w-full"
              value={otherLanguage}
              onChange={handleOtherLanguageChange}
            onBlur={handleOtherLanguageBlur}
            />
            
          </div>
        )}
        {formData.service === "Concierge" && (
          <p className="text-sm text-custom-orange-1 mt-2">
            Please note that all Amplify hosting will be in English. If you need in-language hosting, please select in-Language Services on the
            previous screen.
          </p>
        )}
      </div>

      {/* Respondent Country  */}
      <div>
        <Label className="text-sm font-medium">Respondent Country</Label>
        <Select
          value={countrySelection}
          onValueChange={(value: "USA" | "Other") =>
            handleCountrySelection(value)
          }
        >
          <SelectTrigger className="w-full">{countrySelection}</SelectTrigger>
          <SelectContent>
            <SelectItem value="USA">USA</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        {countrySelection === "Other" && (
          <div className="mt-2">
            <Label className="text-sm font-medium">Specify Country Name</Label>
            <Input
              type="text"
               className={`mt-1 w-full ${otherCountryError ? "border-red-500" : ""}`}
           value={otherCountry}
           onChange={handleOtherCountryChange}
           onBlur={handleOtherCountryBlur}
            />
            {otherCountryError && (
         <p className="text-red-500 text-sm">{otherCountryError}</p>
        )}
          </div>
        )}
      </div>

      {/* Sessions Table */}
      <div>
        <h2 className="text-lg font-bold flex items-center">
          Sessions Information
          <Tooltip>
            <TooltipTrigger asChild>
              <BiQuestionMark className="ml-2 h-5 w-5 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] p-0.5" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="
        bg-white 
        border border-gray-200 
        rounded-lg 
        p-3 
        max-w-xs 
        shadow-lg
      "
            >
              <div className="text-sm text-gray-700">
                If you have sessions of varying lengths, use the{" "}
                <span
                  className="
            inline-flex items-center justify-center 
            w-5 h-5 border-[1px]
           border-custom-orange-2 p-0.5 
            rounded-full 
            text-custom-orange-2 
            font-bold
          "
                >
                  +
                </span>{" "}
                to add additional sessions.
              </div>
            </TooltipContent>
          </Tooltip>
        </h2>
    
        <SessionsTable
          initialSessions={sessionRows}
          onChange={(newRows) => setSessionRows(newRows)}
        />
      </div>
    </div>
  );
};

export default Step3;
