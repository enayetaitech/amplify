"use client";

import React from "react";
import { ISessionFormData } from "./AddSessionModal";
import { Label } from "components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Input } from "components/ui/input";
import { Card } from "components/ui/card";
import MultiSelectDropdown from "./MultiSelectDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { durations } from "constant";
import { makeOnChange } from "utils/validationHelper";
import {
  alphanumericSingleSpace,
  noLeadingSpace,
  noMultipleSpaces,
} from "schemas/validators";

interface AddSessionStep2Props {
  formData: ISessionFormData;
  updateFormData: (fields: Partial<ISessionFormData>) => void;
  isSaving: boolean;
}

const AddSessionStep2: React.FC<AddSessionStep2Props> = ({
  formData,
  updateFormData,
  isSaving,
}) => {
  const { allModerators = [], selectedModerators, sessions } = formData;

  // only the ones picked in step 1
  const availableMods = allModerators.filter((m) =>
    selectedModerators.includes(m._id!)
  );
  const updateSession = (
    index: number,
    fields: Partial<(typeof sessions)[0]>
  ) => {
    const updated = sessions.map((s, i) =>
      i === index ? { ...s, ...fields } : s
    );
    updateFormData({ sessions: updated });
  };

  // Compute time conflicts to show inline feedback
  const parseToUtcMs = (dateStr: string, timeStr: string): number | null => {
    if (!dateStr || !timeStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
    return Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  };

  const timedRows = sessions
    .map((s, idx) => {
      const durationMin = Number(
        formData.sameSession
          ? formData.sessions[0]?.duration ?? 0
          : s.duration ?? 0
      );
      const startMs = parseToUtcMs(s.date, s.startTime);
      const endMs =
        startMs !== null
          ? startMs + Math.max(0, durationMin) * 60 * 1000
          : null;
      const label = s.title?.trim() ? s.title.trim() : `Session ${idx + 1}`;
      return { idx, startMs, endMs, label } as const;
    })
    .filter((r) => r.startMs !== null && r.endMs !== null) as Array<{
    idx: number;
    startMs: number;
    endMs: number;
    label: string;
  }>;

  let conflictMessage: string | null = null;
  if (timedRows.length > 1) {
    const sorted = [...timedRows].sort((a, b) => a.startMs - b.startMs);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.startMs < prev.endMs) {
        conflictMessage = `Time conflict: "${prev.label}" overlaps with "${curr.label}"`;
        break;
      }
    }
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Session Table</Label>
      {conflictMessage && (
        <div className="text-sm text-red-600">{conflictMessage}</div>
      )}
      <div className="overflow-x-auto">
        <Card className="max-h-[400px] overflow-y-auto border-0 shadow-sm py-0 min-w-[900px]">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Moderator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((sess, idx) => {
                const rowMods = formData.sameModerator
                  ? formData.selectedModerators
                  : sess.moderators;

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={sess.title}
                        placeholder="Title"
                        className="w-full"
                        disabled={isSaving}
                        onChange={makeOnChange<"title">(
                          "title",
                          [
                            noLeadingSpace,

                            noMultipleSpaces,
                            alphanumericSingleSpace,
                          ],
                          "Title must be letters/numbers only, single spaces, no edge spaces.",
                          (upd) => updateSession(idx, { title: upd.title })
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={sess.date}
                        disabled={isSaving}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full"
                        onChange={(e) =>
                          updateSession(idx, { date: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={sess.startTime}
                        className="w-full"
                        disabled={isSaving}
                        onChange={(e) =>
                          updateSession(idx, { startTime: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {formData.sameSession ? (
                        <Select
                          value={String(formData.sessions[0]?.duration ?? "")}
                          disabled
                          onValueChange={() => {}}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {durations.map(({ label, minutes }) => (
                              <SelectItem
                                key={minutes}
                                value={minutes.toString()}
                              >
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={sess.duration}
                          disabled={isSaving}
                          onValueChange={(val) =>
                            updateSession(idx, { duration: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {durations.map(({ label, minutes }) => (
                              <SelectItem
                                key={minutes}
                                value={minutes.toString()}
                              >
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {formData.sameModerator ? (
                        <div className="flex flex-wrap gap-2">
                          {availableMods.map((mod) => (
                            <span
                              key={mod._id}
                              className="text-xs bg-muted px-2 py-1 rounded-full border"
                            >
                              {mod.firstName} {mod.lastName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <MultiSelectDropdown
                          moderators={availableMods}
                          selected={rowMods}
                          onChange={(ids) => {
                            if (!formData.sameModerator) {
                              updateSession(idx, { moderators: ids });
                            }
                          }}
                          disabled={formData.sameModerator || isSaving}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AddSessionStep2;
