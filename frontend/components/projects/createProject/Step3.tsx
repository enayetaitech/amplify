"use client";

import React, { useState, useEffect } from "react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "components/ui/select";
import { CheckIcon } from "lucide-react";
import { IProjectFormState } from "app/(dashboard)/create-project/page";
import { IProjectSession, SessionRow } from "@shared/interface/project.interface";
import { durationMapping, durations } from "constant";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export interface Step3Props {
  formData: IProjectFormState;
  updateFormData: (fields: Partial<IProjectFormState>) => void;
  uniqueId: string | null;
}

const availableLanguages = ["English", "French", "German", "Spanish", "Other"];

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

  // ========= Sessions =========
  const [sessionRows, setSessionRows] = useState<SessionRow[]>(
    formData.sessions && Array.isArray(formData.sessions)
      ? formData.sessions.map((s: IProjectSession, index: number) => ({
          id: String(index),
          number: s.number,
          duration: s.duration,
        }))
      : []
  );

  // ========= Update Parent State =========
  useEffect(() => {
    // Compute final respondent languages:
    // Replace "Other" with the input from the otherLanguage field, if provided.
    const computedLanguages = selectedLanguages.includes("Other")
      ? [
          ...selectedLanguages.filter((lang) => lang !== "Other"),
          ...(otherLanguage.trim() ? [otherLanguage.trim()] : []),
        ]
      : selectedLanguages;

    const finalCountry = countrySelection === "USA" ? "USA" : otherCountry.trim();

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
  }, [projectName, selectedLanguages, otherLanguage, countrySelection, otherCountry, sessionRows]);

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
  };

  // ========= Sessions Handlers =========
  const addSessionRow = () => {
    const newRow: SessionRow = {
      id: Date.now().toString(),
      number: 1,
      duration: durations[0],
    };
    setSessionRows((prev) => [...prev, newRow]);
  };

  const updateSessionRow = <K extends keyof SessionRow>(id: string, field: K, value:  SessionRow[K]) => {
    setSessionRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const deleteSessionRow = (id: string) => {
    setSessionRows((prev) => prev.filter((row) => row.id !== id));
  };

  const totalSessions = sessionRows.reduce((acc, row) => acc + Number(row.number), 0);
  const totalDurationMinutes = sessionRows.reduce(
    (acc, row) => acc + Number(row.number) * (durationMapping[row.duration] || 0),
    0
  );
  const totalHoursDecimal = totalDurationMinutes / 60;
  const hoursText =
    totalHoursDecimal % 1 === 0 ? String(totalHoursDecimal) : totalHoursDecimal.toFixed(2);

  return (
    <div className="space-y-6">
       {/* Project Name Input */}
       <div>
        <Label className="block text-sm font-medium text-gray-700">
          Project Name*
        </Label>
        <Input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="mt-1 w-full"
        />
      </div>
      {/* Multi-Select for Languages using Popover and Command */}
      <div>
        <Label className="block text-sm font-medium text-gray-700">
          Respondent Language(s)* 
        </Label>
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
                    className="cursor-pointer"
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
            <Label className="block text-sm font-medium text-gray-700">
              Other Language(s)* 
            </Label>
            <Input
              type="text"
              value={otherLanguage}
              onChange={(e) => setOtherLanguage(e.target.value)}
            />
          </div>
        )}
        {formData.service === "Concierge" && (
          <p className="text-sm text-gray-500 mt-2">
            If selected Concierge Service, please note that all Amplify hosting will be in English.
            If you need in-language hosting, please select in-Language Services on the previous screen.
          </p>
        )}
      </div>

      {/* Respondent Country using Shadcn UI Select */}
      <div>
        <Label className="block text-sm font-medium text-gray-700">
          Respondent Country
        </Label>
        <Select
          value={countrySelection}
          onValueChange={(value: "USA" | "Other") => handleCountrySelection(value)}
        >
          <SelectTrigger className="w-full">
            <Button variant="outline" className="w-full text-left">
              {countrySelection}
            </Button>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USA">USA</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        {countrySelection === "Other" && (
          <div className="mt-2">
            <Label className="block text-sm font-medium text-gray-700">
              Specify Country Name
            </Label>
            <Input
              type="text"
              value={otherCountry}
              onChange={handleOtherCountryChange}
            />
          </div>
        )}
      </div>

      {/* Sessions Table */}
      <div>
        <h2 className="text-lg font-bold">Sessions</h2>
        <table className="min-w-full mt-4 border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Number of Sessions</th>
              <th className="border px-4 py-2">Duration</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessionRows.map((row) => (
              <tr key={row.id}>
                <td className="border px-4 py-2">
                  <Input
                    type="number"
                    min="1"
                    value={row.number}
                    onChange={(e) =>
                      updateSessionRow(row.id, "number", Number(e.target.value))
                    }
                    className="w-full"
                  />
                </td>
                <td className="border px-4 py-2">
                  <Select
                    value={row.duration}
                    onValueChange={(value) => updateSessionRow(row.id, "duration", value)}
                  >
                    <SelectTrigger className="w-full">
                      <Button variant="outline" className="w-full text-left">
                        {row.duration}
                      </Button>
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-4 py-2 text-center">
                  <Button variant="outline" onClick={() => deleteSessionRow(row.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td className="border px-4 py-2 font-bold">
                Total Sessions: {totalSessions}
              </td>
              <td className="border px-4 py-2 font-bold" colSpan={2}>
                Total Duration: {hoursText} hour{hoursText !== "1" ? "s" : ""} (
                {totalDurationMinutes} minute{totalDurationMinutes !== 1 ? "s" : ""})
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4">
          <Button onClick={addSessionRow}>+ Add Session</Button>
        </div>
      </div>
    </div>
  );
};

export default Step3;
