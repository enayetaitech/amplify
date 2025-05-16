"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Button } from "components/ui/button";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { toast } from "sonner";

interface ProjectSummaryProps {
  project: IProject;
  firstSessionDate: Date;
  onTagEditClick: () => void;
}

export default function ProjectSummary({
  project,
  firstSessionDate,
  onTagEditClick,
}: ProjectSummaryProps) {
  const projectId = project._id!;
  const queryClient = useQueryClient();

  // Internal-name editing
  const [editingName, setEditingName] = useState(false);
  const [newInternalName, setNewInternalName] = useState(
    project.internalProjectName || ""
  );
  const editName = useMutation<ApiResponse<IProject>, Error, { projectId: string; internalProjectName: string }>({
    mutationFn: async ({ projectId, internalProjectName }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, internalProjectName }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Internal project name updated");
      setEditingName(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // Description editing
  const [editingDesc, setEditingDesc] = useState(false);
  const [newDescription, setNewDescription] = useState(project.description || "");
  const editDesc = useMutation<ApiResponse<IProject>, Error, { projectId: string; description: string }>({
    mutationFn: async ({ projectId, description }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, description }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Description updated");
      setEditingDesc(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // Toggle recording access
  const toggleRecording = useMutation<ApiResponse<IProject>, Error, void>({
    mutationFn: async () => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/toggle-recording-access",
        { projectId }
      );
      
      return res.data;
    },
    onSuccess: (response) => {
        const updated = response.data;
    // Show a different message depending on the new state
    if (updated.recordingAccess) {
      toast.success("Recording access granted");
    } else {
      toast.success("Recording access revoked");
    }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Project Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Project Name:</span>
          <span className="font-medium">{project.name}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Internal Project Name: {project.internalProjectName}
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
                  editName.mutate({ projectId, internalProjectName: newInternalName })
                }
                disabled={editName.isPending}
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
              onClick={() => setEditingName(true)}
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
                    editDesc.mutate({ projectId, description: newDescription })
                  }
                  disabled={editDesc.isPending}
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
            {firstSessionDate.toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Observer Reading Access:
          </span>
          <Switch
            checked={project.recordingAccess}
            onCheckedChange={() => toggleRecording.mutate()}
            disabled={toggleRecording.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
