"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IProject } from "@shared/interface/ProjectInterface";
import api from "lib/api";
import { Button } from "components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const {
    data: project,
    isLoading,
    error,
  } = useQuery<IProject, Error>({
    queryKey: ["project", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  });

  if (isLoading) return <p>Loading project overview…</p>;
  if (error) return <p className="text-red-500">Failed to load project.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">About this project</h2>
      <p>{project?.name || "No description provided."}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm">
          Status: <strong>{project?.status}</strong>
        </span>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await api.post(`/api/v1/projects/${projectId}/pause`);
              toast.success("Project paused");
              router.refresh();
            } catch {
              toast.error("Failed to pause project");
            }
          }}
        >
          Pause
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await api.post(`/api/v1/projects/${projectId}/unpause`);
              toast.success("Project unpaused");
              router.refresh();
            } catch {
              toast.error("Failed to unpause project");
            }
          }}
        >
          Unpause
        </Button>
      </div>
    </div>
  );
}
