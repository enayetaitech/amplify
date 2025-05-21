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

interface AddSessionStep2Props {
  formData: ISessionFormData;
  updateFormData: (fields: Partial<ISessionFormData>) => void;
}

const AddSessionStep2: React.FC<AddSessionStep2Props> = ({
  formData,
  updateFormData,
}) => {
  const { allModerators = [], selectedModerators, sessions,
   } = formData;

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


  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Session Schedule</Label>
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
                // if sameModerator, always show the step-1 picks
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
                        onChange={(e) =>
                          updateSession(idx, { title: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={sess.date}
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
                        onChange={(e) =>
                          updateSession(idx, { startTime: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={sess.duration}
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
                    </TableCell>
                    <TableCell>
                      <MultiSelectDropdown
                        moderators={availableMods}
                        selected={rowMods}
                        onChange={(ids) => {
            if (!formData.sameModerator) {
              updateSession(idx, { moderators: ids });
            }
          }}
          disabled={formData.sameModerator}
                      />
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
