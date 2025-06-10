"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Button } from "components/ui/button";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { IProject } from "@shared/interface/ProjectInterface";
import { getFirstSessionDate } from "utils/getFirstSessionDate";
import { useEditProjectName } from "hooks/useEditProjectName";
import { useEditProjectDescription } from "hooks/useEditProjectDescription";
import { useToggleRecordingAccess } from "hooks/useToggleRecordingAccess";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/ui/tooltip";
import { BiQuestionMark } from "react-icons/bi";

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
  const [editingName, setEditingName] = useState(false);
  const [newInternalName, setNewInternalName] = useState(
    project.internalProjectName || ""
  );
  const { mutate: editName, isPending: isEditingName } =
    useEditProjectName(projectId);

  // Description editing
  const [editingDesc, setEditingDesc] = useState(false);
  const [newDescription, setNewDescription] = useState(
    project.description || ""
  );

  const { mutate: editDesc, isPending: isEditingDesc } =
    useEditProjectDescription(projectId);

  // Toggle recording access
  const { mutate: toggleRecording, isPending: isTogglingRecording } =
    useToggleRecordingAccess(projectId);

  const firstSessionDate = React.useMemo(
    () => getFirstSessionDate(project),
    [project]
  );

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

        <div className="flex justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <span className="flex items-center">
              Internal Project Name
              <Tooltip>
                <TooltipTrigger asChild>
                  <BiQuestionMark className="ml-2 h-4 w-4 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] p-0.5" />
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
                    What will participants call your project?
                  </div>
                </TooltipContent>
              </Tooltip>
            </span>
            : {project.internalProjectName}
          </span>
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newInternalName}
                onChange={(e) => setNewInternalName(e.target.value)}
              />
              <Button
                size="icon"
                onClick={() =>
                  editName(
                    { projectId, internalProjectName: newInternalName },
                    {
                      onSuccess: () => {
                        setEditingName(false);
                      },
                    }
                  )
                }
                disabled={isEditingName}
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={() => setEditingName(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 cursor-pointer text-sm"
              onClick={() => {
                setNewInternalName(project.internalProjectName || "");
                setEditingName(true);
              }}
            >
              <PencilIcon className="h-2.5 w-2.5" /> Edit
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Description: {project.description}
          </span>
          {editingDesc ? (
            <div className="flex flex-col gap-2 w-2/3">
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="icon"
                  onClick={() =>
                    editDesc(
                      { projectId, description: newDescription },
                      {
                        onSuccess: () => {
                          setEditingDesc(false);
                        },
                      }
                    )
                  }
                  disabled={isEditingDesc}
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={() => setEditingDesc(false)}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 cursor-pointer text-sm"
              onClick={() => setEditingDesc(true)}
            >
              <PencilIcon className="h-2.5 w-2.5" /> Edit
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Tags:{" "}
            {project.tags.length > 0
              ? project.tags.map((t) => t.title).join(", ")
              : "—"}
          </span>
          <div
            className="flex items-center gap-1 cursor-pointer text-sm"
            onClick={onTagEditClick}
          >
            <PencilIcon className="h-2.5 w-3" />
            {project.tags.length > 0 ? "Edit" : "Add"}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Fieldwork Start Date:</span>
          <span className="font-medium">
            {firstSessionDate ? firstSessionDate.toLocaleDateString() : "—"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Service Type: {project.service}
           
          </span>
          
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 flex">
            Observer Recording Access:{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <BiQuestionMark className="ml-2 h-4 w-4 text-custom-orange-2 hover:text-custom-orange-1 cursor-help rounded-full border-custom-orange-2 border-[1px] p-0.5" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="bg-white border border-gray-200 
        rounded-lg p-3 max-w-xs shadow-lg"
              >
                <div className="text-sm text-gray-700">
                  Do you want all your Observers to be able to access all
                  Recordings and Transcripts for the project?
                </div>
              </TooltipContent>
            </Tooltip>
          </span>
          <Switch
            checked={project.recordingAccess}
            onCheckedChange={() => toggleRecording()}
            disabled={isTogglingRecording}
            className="cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
}
