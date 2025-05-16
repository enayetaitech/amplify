"use client";

import { Switch } from "@/components/ui/switch";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IProject } from "@shared/interface/ProjectInterface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import ComponentContainer from "components/shared/ComponentContainer";

import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import TagModal from "components/viewProject/TagModel";
import api from "lib/api";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const fetchProjectById = async (id: string) => {
  const res = await api.get<ApiResponse<IProject>>(
    `/api/v1/projects/get-project-by-id/${id}`
  );
  return res.data.data;
};

const ViewProject = () => {
  const { id: projectId } = useParams() as { id: string };
  const queryClient = useQueryClient();
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const {
    data: project,
    isPending: isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
  });

  // Get the earliest meeting date (or fall back to project.startDate if no meetings)
  const firstSessionDate = React.useMemo(() => {
    if (!project?.meetings?.length) {
      return;
    }

    // 1. Build a Date object for each meeting (date + startTime)
    const sessionDateTimes = project.meetings.map((m) => {
      const meetingDate = new Date(m.date);
      const [hour, minute] = m.startTime.split(":").map(Number);
      return new Date(
        meetingDate.getFullYear(),
        meetingDate.getMonth(),
        meetingDate.getDate(),
        hour,
        minute
      );
    });

    // 2. Compute “today at midnight”
    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // 3. Keep only sessions on or after today
    const upcoming = sessionDateTimes.filter((dt) => dt >= todayMidnight);

    // 4. If there are any, pick the earliest; otherwise fall back
    if (upcoming.length) {
      return upcoming.reduce(
        (earliest, curr) => (curr < earliest ? curr : earliest),
        upcoming[0]
      );
    } else {
      return new Date(project!.startDate);
    }
  }, [project]);

  // EDIT INTERNAL NAME
  const [editingName, setEditingName] = useState(false);
  const [newInternalName, setNewInternalName] = useState("");

  const editNameMutation = useMutation<
    ApiResponse<IProject>, 
    Error,
    { projectId: string; internalProjectName: string } 
  >({
    mutationFn: async ({ projectId, internalProjectName }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, internalProjectName }
      );
      return res.data; // ← unwrap here
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Internal project name updated");
      setEditingName(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // EDIT DESCRIPTION
  const [editingDesc, setEditingDesc] = useState(false);
  const [newDescription, setNewDescription] = useState("");

  // mutation for description
  const editDescMutation = useMutation<
    ApiResponse<IProject>, // TData
    Error, // TError
    { projectId: string; description: string } // TVariables
  >({
    mutationFn: async ({ projectId, description }) => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/edit-project",
        { projectId, description }
      );
      return res.data; // unwrap the AxiosResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Description updated");
      setEditingDesc(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // TOGGLE RECORDING ACCESS
  const toggleRecordingMutation = useMutation<
    ApiResponse<IProject>, // TData
    Error, // TError
    void // TVariables
  >({
    mutationFn: async () => {
      const res = await api.patch<ApiResponse<IProject>>(
        "/api/v1/projects/toggle-recording-access",
        { projectId }
      );
      return res.data; // unwrap AxiosResponse→ApiResponse<IProject>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Recording access toggled");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <p>Loading project…</p>;
  if (isError)
    return <p className="text-red-500">Error: {(error as Error).message}</p>;

  console.log("project id", project);
  return (
    <ComponentContainer>
      <div className=" py-5 ">
        <HeadingBlue25px>{project!.name}</HeadingBlue25px>
        {/* two-column grid on md+ */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Summary */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-custom-dark-blue-1">
                Project Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Project Name:</span>
                <span className="font-medium text-custom-dark-blue-1">
                  {project!.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Internal Project Name: {project!.internalProjectName}
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
                        editNameMutation.mutate({
                          projectId,
                          internalProjectName: newInternalName,
                        })
                      }
                      disabled={editNameMutation.isPending}
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
                      setNewInternalName(project!.internalProjectName);
                      setEditingName(true);
                    }}
                  >
                    <PencilIcon className="h-2.5 w-2.5" /> Edit
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Description: {project!.description}
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
                          editDescMutation.mutate({
                            projectId,
                            description: newDescription,
                          })
                        }
                        disabled={editDescMutation.isPending}
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
                    onClick={() => {
                      setNewDescription(project!.description);
                      setEditingDesc(true);
                    }}
                  >
                    <PencilIcon className="h-2.5 w-2.5" /> Edit
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Tags:{" "}
                  {project.tags && project.tags.length > 0
                    ? project.tags.map((t) => t.title).join(", ")
                    : "—"}
                </span>
                <div
                  className="flex justify-center items-center gap-1 text-sm cursor-pointer"
                  onClick={() => setIsTagModalOpen(true)}
                >
                  {project!.tags.length > 0 && (
                    <PencilIcon className="h-2.5 w-3" />
                  )}
                  {project!.tags && project!.tags.length > 0 ? "Edit" : "Add"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">
                  Fieldwork Start Date:
                </span>
                <span className="text-sm text-custom-dark-blue-1">
                  {firstSessionDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Service Type:</span>
                <span className="text-sm text-custom-dark-blue-1">
                  {project!.service}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Observer Reading Access:
                </span>
                <Switch
                  className="cursor-pointer"
                  checked={project!.recordingAccess}
                  onCheckedChange={() => toggleRecordingMutation.mutate()}
                  disabled={toggleRecordingMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Credit Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-custom-dark-blue-1">
                Credit Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Original Estimated Project Credits:
                </span>
                <span className="font-medium">
                  {project!.cumulativeMinutes /* or your field */}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Project Credits Used to Date:
                </span>
                <span className="font-medium">1245</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Project Credits Needed for Remaining Schedule:
                </span>
                <span className="font-medium">3000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  New Total Project Credit Estimate:
                </span>
                <span className="font-medium">4245</span>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-2">
                  Need more credits or want to check your account balance?
                </p>
                <Button variant="secondary">View Credits</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <TagModal
        projectId={project!._id!}
        open={isTagModalOpen}
        onOpenChange={setIsTagModalOpen}
        existingTags={project!.tags}
      />
    </ComponentContainer>
  );
};

export default ViewProject;
