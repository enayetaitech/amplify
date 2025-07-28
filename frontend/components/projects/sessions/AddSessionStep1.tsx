"use client";

import { Switch } from "@/components/ui/switch";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { timeZones } from "constant";
import api from "lib/api";
import React, { useEffect, useRef, useState } from "react";
import AddModeratorModal from "./AddModeratorModal";
import { ISessionFormData } from "./AddSessionModal";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { useParams } from "next/navigation";
import { BiQuestionMark } from "react-icons/bi";

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
    
    if (data?.data && formData.allModerators?.length === 0) {
      updateFormData({ allModerators: data.data });
    }
  
  }, [data?.data]);



  if (error) {
    console.error("Error fetching moderators:", error.message);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex gap-3 items-end">
          <div>
            <Label className="font-semibold text-sm mb-1 block">
              Moderators<span className="text-red-500">*</span>
            </Label>
            <MultiSelectDropdown
              moderators={data?.data || []}
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

      {/* Breakout Room Toggle with Tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="font-medium text-sm">
            Do you need breakout room functionality?
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                      <BiQuestionMark className="ml-2 h-5 w-5 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] px-0.5 mb-1.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white text-black shadow-sm">
                Breakout rooms allow you to split participants into separate
                rooms during your session for smaller group discussions or
                activities. The moderator can only be present in one room at a
                time, but all breakout rooms will be streamed to the backroom
                for observers to view and will be recorded.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.breakoutRoom}
            onCheckedChange={(b) => updateFormData({ breakoutRoom: b })}
            className="cursor-pointer"
          />
          <span className="text-sm font-medium">
            {formData.breakoutRoom ? "Yes" : "No"}
          </span>
        </div>
      </div>

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

      {/* Time Zone */}
      <div>
        <Label className="font-semibold text-sm mb-1 block">
          Time Zone<span className="text-red-500">*</span>
        </Label>
        <Select onValueChange={(tz) => updateFormData({ timeZone: tz })}>
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {timeZones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                <span className="text-muted-foreground mr-1">
                  (UTC{tz.utc})
                </span>
                <span className="font-semibold">{tz.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
