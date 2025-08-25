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
import {
  ALPHA_REGEX,
  availableLanguages,
  durations,
  PROJECT_NAME_REGEX,
} from "constant";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Step3Props } from "@shared/interface/CreateProjectInterface";
import { IProjectForm } from "@shared/interface/ProjectFormInterface";
import { Switch } from "components/ui/switch";
import { Tooltip, TooltipTrigger } from "components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { BiQuestionMark } from "react-icons/bi";
import { timeZones } from "constant";
import SessionsTable from "./SessionsTable";
import {
  alphanumericSingleSpace,
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  noTrailingSpace,
  validate,
} from "schemas/validators";
import { makeOnChange } from "utils/validationHelper";

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
  const [otherLangError, setOtherLangError] = useState<string>("");
  const [projectName, setProjectName] = useState<string>(formData.name || "");
  const [defaultTimeZone, setDefaultTimeZone] = useState<
    IProjectForm["defaultTimeZone"] | ""
  >(formData.defaultTimeZone ?? "");
  const [defaultBreakoutRoom, setDefaultBreakoutRoom] = useState<boolean>(
    formData.defaultBreakoutRoom ?? false
  );
  const [projectNameError, setProjectNameError] = useState<string>("");
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
    if (!validateProjectName()) return;

    if (selectedLanguages.includes("Other") && !validateOtherLanguage()) return;

    const computedLanguages = selectedLanguages.includes("Other")
      ? [
          ...selectedLanguages.filter((lang) => lang !== "Other"),
          ...(otherLanguage.trim() ? [otherLanguage.trim()] : []),
        ]
      : selectedLanguages;

    if (countrySelection === "Other" && !validateOtherCountry()) return;

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
      defaultTimeZone:
        (defaultTimeZone as IProjectForm["defaultTimeZone"]) || undefined,
      defaultBreakoutRoom,
    });

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

  const validateProjectName = () => {
    const trimmed = projectName.trim();

    if (!trimmed) {
      setProjectNameError("Project Name is required.");
      return false;
    }

    // compose all your rules in one call:
    const ok = validate(trimmed, [
      noLeadingSpace,
      noTrailingSpace,
      noMultipleSpaces,
      (v) => PROJECT_NAME_REGEX.test(v),
    ]);

    if (!ok) {
      setProjectNameError(
        "Project Name must be letters, numbers, dashes/underscores, single spaces, no edge spaces."
      );
      return false;
    }

    setProjectNameError("");
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Project Name Input */}
      <div>
        <Label className="text-sm font-medium">Project Name*</Label>
        <Input
          type="text"
          className={`mt-1 w-full ${projectNameError ? "border-red-500" : ""}`}
          autoFocus
          value={projectName}
          onChange={makeOnChange<"projectName">(
            "projectName",
            [noLeadingSpace, noMultipleSpaces, alphanumericSingleSpace],
            "Project Name must only contain letters/numbers and single spaces (no edge/multiple spaces).",
            (upd) => {
              setProjectName(upd.projectName);
              if (projectNameError) setProjectNameError("");
            }
          )}
          onBlur={validateProjectName}
          required
        />
        {projectNameError && (
          <p className="text-red-500 text-sm mt-1">{projectNameError}</p>
        )}
      </div>
      {/* Default Time Zone and Breakout Room */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Default Time Zone</Label>
          <Select
            value={defaultTimeZone ?? ""}
            onValueChange={(v) =>
              setDefaultTimeZone(v as IProjectForm["defaultTimeZone"])
            }
          >
            <SelectTrigger className="w-full">
              {defaultTimeZone || "Select time zone"}
            </SelectTrigger>
            <SelectContent>
              {timeZones.map(
                (tz: { value: string; utc: string; name: string }) => {
                  const computedLabel =
                    tz.utc === "+00" && tz.name === "London Time"
                      ? "(UTC-00) London Time"
                      : `(UTC${tz.utc}) ${tz.name}`;
                  return (
                    <SelectItem
                      key={`${tz.value}-${tz.utc}`}
                      value={
                        (computedLabel as IProjectForm["defaultTimeZone"]) || ""
                      }
                    >
                      {computedLabel}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Do you need breakout room functionality?</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <BiQuestionMark className="ml-2 h-5 w-5 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] px-0.5 mb-1.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white text-black shadow-sm p-2 z-50">
                Breakout rooms allow you to split participants into separate
                rooms during your session for smaller group discussions or
                activities. The moderator can only be present in one room at a
                time, but all breakout rooms will be streamed to the backroom
                for observers to view and will be recorded.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={defaultBreakoutRoom}
              onCheckedChange={(b) => setDefaultBreakoutRoom(b)}
              className="cursor-pointer"
            />
            <span className="text-sm font-medium">
              {defaultBreakoutRoom ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="otherLanguage"
                placeholder="Enter language"
                value={otherLanguage}
                onChange={makeOnChange<"otherLanguage">(
                  "otherLanguage",
                  [noLeadingSpace, noMultipleSpaces, lettersAndSpaces],
                  "Language must contain only letters & spaces, no edge spaces.",
                  ({ otherLanguage }) => {
                    setOtherLanguage(otherLanguage);
                    if (otherLangError) setOtherLangError("");
                  }
                )}
                onBlur={() => {
                  // final trim + collapse spaces
                  const clean = otherLanguage.trim().replace(/\s+/g, " ");
                  setOtherLanguage(clean);
                  validateOtherLanguage();
                }}
                className={`mt-1 w-full ${
                  otherLangError ? "border-red-500" : ""
                }`}
              />
              {otherLangError && (
                <p className="text-red-500 text-sm mt-1">{otherLangError}</p>
              )}
            </div>
          )}
          {formData.service === "Concierge" && (
            <p className="text-sm text-custom-orange-1 mt-2">
              Please note that all Amplify hosting will be in English. If you
              need in-language hosting, please select in-Language Services on
              the previous screen.
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
              <Label className="text-sm font-medium">
                Specify Country Name
              </Label>
              <Input
                name="otherCountry"
                placeholder="Enter country"
                value={otherCountry}
                onChange={makeOnChange<"otherCountry">(
                  "otherCountry",
                  [noLeadingSpace, noMultipleSpaces, lettersAndSpaces],
                  "Country must contain only letters & spaces, no edge spaces.",
                  ({ otherCountry }) => {
                    setOtherCountry(otherCountry);
                    if (otherCountryError) setOtherCountryError("");
                  }
                )}
                onBlur={() => {
                  const clean = otherCountry.trim().replace(/\s+/g, " ");
                  setOtherCountry(clean);
                  validateOtherCountry();
                }}
                className={`mt-1 w-full ${
                  otherCountryError ? "border-red-500" : ""
                }`}
              />
              {otherCountryError && (
                <p className="text-red-500 text-sm mt-1">{otherCountryError}</p>
              )}
            </div>
          )}
        </div>
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
