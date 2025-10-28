"use client";

import { Switch } from "components/ui/switch";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import CustomButton from "components/shared/CustomButton";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "components/ui/tooltip";
// import { timeZones } from "constant";
import { durations } from "constant";
import api from "lib/api";
import React, { useEffect, useRef, useState } from "react";
import AddModeratorModal from "./AddModeratorModal";
import { ISessionFormData } from "./AddSessionModal";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { useParams } from "next/navigation";
// import { BiQuestionMark } from "react-icons/bi";

interface AddSessionStep1Props {
  formData: ISessionFormData;
  updateFormData: (fields: Partial<ISessionFormData>) => void;
}

const AddSessionStep1: React.FC<AddSessionStep1Props> = ({
  formData,
  updateFormData,
}) => {
  const { projectId } = useParams();
  const limit = 100;
  const page = 1;
  const [showAddModal, setShowAddModal] = useState(false);
  const prevNumRef = useRef<number>(formData.numberOfSessions);

  const {
    data,
    // isLoading,
    error,
    refetch: refetchModerators,
  } = useQuery<{ data: IModerator[]; meta: IPaginationMeta }, Error>({
    queryKey: ["moderators", projectId],
    queryFn: () =>
      api
        .get<{ data: IModerator[]; meta: IPaginationMeta }>(
          `/api/v1/moderators/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    // only re-run when the count changes
    if (prevNumRef.current === formData.numberOfSessions) {
      return;
    }
    prevNumRef.current = formData.numberOfSessions;

    updateFormData({
      sessions: Array.from(
        { length: formData.numberOfSessions },
        (_, i) =>
          formData.sessions[i] || {
            title: "",
            date: "",
            startTime: "",
            duration: "",
            moderators: [],
          }
      ),
    });
  }, [formData.numberOfSessions, formData.sessions, updateFormData]);

  useEffect(() => {
    if (!data?.data) return;
    // Only include project members who are Admin or Moderator (exclude Observers)
    const filtered = (data.data || []).filter(
      (m) =>
        Array.isArray(m.roles) &&
        (m.roles.includes("Admin") || m.roles.includes("Moderator"))
    );
    if (filtered && formData.allModerators?.length === 0) {
      updateFormData({ allModerators: filtered });
    }
  }, [data?.data]);

  if (error) {
    console.error("Error fetching moderators:", error.message);
  }

  return (
    <div className="space-y-5">
      {/* Number of Sessions */}
      <div>
        <Label className="font-semibold text-sm mb-1 block">
          Number of Sessions<span className="text-red-500">*</span>
        </Label>
        <Select
          onValueChange={(val) =>
            updateFormData({ numberOfSessions: Number(val) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select number" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Are all sessions the same length? */}
      <div className="flex items-center justify-between">
        <Label className="font-medium text-sm">
          Are all sessions the same length?
        </Label>
        <div className="flex items-center gap-2">
          <Switch
            className="cursor-pointer"
            checked={formData.sameSession}
            onCheckedChange={(b) => updateFormData({ sameSession: b })}
          />
          <span className="text-sm font-medium">
            {formData.sameSession ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {formData.sameSession && (
        <div>
          <Label className="font-semibold text-sm mb-1 block">
            Session Length
          </Label>
          <Select
            onValueChange={(val) =>
              updateFormData({
                sessions: Array.from(
                  { length: formData.numberOfSessions },
                  (_, i) => ({
                    title: formData.sessions[i]?.title ?? "",
                    date: formData.sessions[i]?.date ?? "",
                    startTime: formData.sessions[i]?.startTime ?? "",
                    duration: val,
                    moderators: formData.sameModerator
                      ? formData.selectedModerators
                      : formData.sessions[i]?.moderators ?? [],
                  })
                ),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((d) => (
                <SelectItem key={d.minutes} value={String(d.minutes)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Same Moderator for All Sessions */}
      <div className="flex items-center justify-between">
        <Label className="font-medium text-sm">
          Do you want the same moderator for all of your sessions?
        </Label>
        <div className="flex items-center gap-2">
          <Switch
            className="cursor-pointer"
            checked={formData.sameModerator}
            onCheckedChange={(b) => updateFormData({ sameModerator: b })}
          />
          <span className="text-sm font-medium">
            {formData.sameModerator ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Moderators */}
      <div>
        <div className="flex gap-3 items-end">
          <div>
            <Label className="font-semibold text-sm mb-1 block">
              Moderators<span className="text-red-500">*</span>
            </Label>
            <MultiSelectDropdown
              moderators={(data?.data || []).filter(
                (m) =>
                  Array.isArray(m.roles) &&
                  (m.roles.includes("Admin") || m.roles.includes("Moderator"))
              )}
              selected={formData.selectedModerators}
              onChange={(ids) => updateFormData({ selectedModerators: ids })}
            />
          </div>

          <CustomButton
            className="bg-custom-teal text-white hover:bg-custom-dark-blue-3"
            onClick={() => setShowAddModal(true)}
          >
            Add Study Moderator
          </CustomButton>
        </div>
      </div>

      <AddModeratorModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetchModerators}
      />
    </div>
  );
};

export default AddSessionStep1;
