"use client";

import React, { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import CustomButton from "components/shared/CustomButton";
import { Upload } from "lucide-react";
import { ISession } from "@shared/interface/SessionInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { useGlobalContext } from "context/GlobalContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

interface UploadProps {
  projectId: string;
}

const UploadObserverDocument: React.FC<UploadProps> = ({ projectId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const queryClient = useQueryClient();
  const { user } = useGlobalContext();

  // 1️⃣ Fetch all sessions for this project
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useQuery<{ data: ISession[]; meta: IPaginationMeta }, Error>({
    queryKey: ["sessions", projectId],
    queryFn: () =>
      api
        .get<{ data: ISession[]; meta: IPaginationMeta }>(
          `/api/v1/sessions/project/${projectId}`,
          { params: { page: 1, limit: 100 } }
        )
        .then((res) => res.data),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });

  const addedBy = user?._id;
  const addedByRole = user?.role;

  // 2️⃣ Mutation to upload the file + projectId + sessionId + user info
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!user) {
        return Promise.reject(new Error("You must be logged in"));
      }
      if (!file) return Promise.reject(new Error("Please select a file"));
      if (!sessionId)
        return Promise.reject(new Error("Please select a session"));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("sessionId", sessionId);
      formData.append("addedBy", addedBy ?? "");
      formData.append("addedByRole", addedByRole ?? "");

      return api.post("/api/v1/observerDocuments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      setFile(null);
      setSessionId("");
      // refetch the document list
      queryClient.invalidateQueries({
        queryKey: ["observerDocs", projectId],
      });
    },
  });

  if (sessionsError) {
    return (
      <p className="text-red-500">
        Error loading sessions: {sessionsError.message}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 pt-5">
        <Select
          value={sessionId}
          onValueChange={setSessionId}
          disabled={isSessionsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a session…" />
          </SelectTrigger>
          <SelectContent>
            {sessionsData?.data.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="file"
          accept="*/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block pr-3"
        />
      </div>
      <div className="flex justify-center pt-5">
        <CustomButton
          icon={<Upload />}
          text={uploadMutation.isPending ? "Uploading..." : "Upload"}
          onClick={() => uploadMutation.mutate()}
          disabled={!file || !sessionId || uploadMutation.isPending}
          variant="default"
          className="bg-custom-orange-2 text-white hover:bg-custom-orange-1"
        />
      </div>
      {uploadMutation.isError && (
        <p className="text-red-500">
          Error: {(uploadMutation.error as Error).message}
        </p>
      )}
    </div>
  );
};

export default UploadObserverDocument;
