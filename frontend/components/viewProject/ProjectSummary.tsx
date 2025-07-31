"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { Switch } from "@/components/ui/switch";
import { IProject } from "@shared/interface/ProjectInterface";
import { getFirstSessionDate } from "utils/getFirstSessionDate";
import { useEditProjectName } from "hooks/useEditProjectName";
import { useEditProjectDescription } from "hooks/useEditProjectDescription";
import { useToggleRecordingAccess } from "hooks/useToggleRecordingAccess";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/ui/tooltip";
import { BiQuestionMark } from "react-icons/bi";
import {
  alphanumericSingleSpace,
  noLeadingSpace,
  noMultipleSpaces,
} from "schemas/validators";
import InlineEditable from "./InlineEditable";

const sharedValidators = [
  { fn: noLeadingSpace, message: "No leading spaces allowed" },
  { fn: noMultipleSpaces, message: "No consecutive spaces allowed" },
  {
    fn: alphanumericSingleSpace,
    message: "Only letters, numbers, and single spaces allowed",
  },
];

interface ProjectSummaryProps {
  project: IProject;
  onTagEditClick: () => void;
}

export default function ProjectSummary({
  project,
  onTagEditClick,
}: ProjectSummaryProps) {
  const projectId = project._id!;

  // Internal-name editing
  const firstSessionDate = React.useMemo(
    () => getFirstSessionDate(project),
    [project]
  );

  // Inline‐edit state + mutations
  const [editingName, setEditingName] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const { mutate: editName, isPending: isEditingName } =
    useEditProjectName(projectId);
  const { mutate: editDesc, isPending: isEditingDesc } =
    useEditProjectDescription(projectId);
  const { mutate: toggleRecording, isPending: isTogglingRecording } =
    useToggleRecordingAccess(projectId);

  // Static info rows
  const infoRows: Array<{
    label: string;
    /** If you need custom left‐side icon (e.g. tooltip), put it here */
    leftIcon?: React.ReactNode;
    /** value on left */
    value: React.ReactNode;
    /** if defined, clicking the icon triggers this */
    onIconClick?: () => void;
    /** control on right side */
    rightControl?: React.ReactNode;
  }> = [
    {
      label: "Tags",
      value:
        project.tags.length > 0
          ? project.tags.map((t) => t.title).join(", ")
          : "—",
      leftIcon: (
        <span
          className="cursor-pointer text-custom-teal"
          onClick={onTagEditClick}
        >
          Edit
        </span>
      ),
    },
    {
      label: "Fieldwork Start Date",
      value: firstSessionDate ? firstSessionDate.toLocaleDateString() : "—",
    },
    {
      label: "Service Type",
      value: project.service,
    },
    {
      label: "Observer Recording Access",
      leftIcon: (
        <Tooltip>
          <TooltipTrigger asChild>
            <BiQuestionMark className="h-4 w-4 text-gray-400 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            Allow observers to see all recordings?
          </TooltipContent>
        </Tooltip>
      ),
      value: project.recordingAccess ? "Yes" : "No",
      rightControl: (
        <Switch
          checked={project.recordingAccess}
          onCheckedChange={() => toggleRecording()}
          disabled={isTogglingRecording}
        />
      ),
    },
  ];

  return (
    <Card className="border-0 shadow-all-sides">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-custom-teal">Project Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Project Name:</span>
          <span className="font-medium">{project.name}</span>
        </div>

        <InlineEditable
          label="Internal Project Name"
          value={project.internalProjectName || ""}
          editing={editingName}
          isPending={isEditingName}
          validators={sharedValidators}
          onStart={() => setEditingName(true)}
          onCancel={() => setEditingName(false)}
          onSave={(newVal) =>
            editName(
              { projectId, internalProjectName: newVal },
              { onSuccess: () => setEditingName(false) }
            )
          }
          editControlType="input"
        />

        <InlineEditable
          label="Description"
          value={project.description || ""}
          editing={editingDesc}
          isPending={isEditingDesc}
          validators={sharedValidators}
          onStart={() => setEditingDesc(true)}
          onCancel={() => setEditingDesc(false)}
          onSave={(newVal) =>
            editDesc(
              { projectId, description: newVal },
              { onSuccess: () => setEditingDesc(false) }
            )
          }
          editControlType="textarea"
        />

        {/* Static rows */}
        {infoRows.map(
          ({ label, leftIcon, value, onIconClick, rightControl }, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{label}:</span>
                <span>{value}</span>
                {leftIcon && (
                  <span onClick={onIconClick} className="ml-1">
                    {leftIcon}
                  </span>
                )}
              </div>
              {rightControl}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
