"use client";

import React, { useState } from "react";
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import api from "../../../lib/api";
import CustomButton from "../../shared/CustomButton";
import { Upload } from "lucide-react";
import { ISession } from "@shared/interface/SessionInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import useUploadObserverDocument from "../../../hooks/useUploadObserverDocument";

interface UploadProps {
  projectId: string;
  onClose: ()=> void;
}

const UploadObserverDocument: React.FC<UploadProps> = ({ projectId, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

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


  // 2️⃣ Mutation to upload the file + projectId + sessionId + user info
  const {
   mutate: upload,
   isPending: isUploading,
   isError: uploadError,
   error: uploadErrorObj,
 } = useUploadObserverDocument(projectId, onClose);

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
          text={isUploading ? "Uploading..." : "Upload"}
          onClick={() => file && sessionId && upload({ file, sessionId })}
          disabled={!file || !sessionId || isUploading}
          variant="default"
          className="bg-custom-orange-2 text-white hover:bg-custom-orange-1"
        />
      </div>
      {uploadError  && (
        <p className="text-red-500">
          Error: {(uploadErrorObj as Error).message}
        </p>
      )}
    </div>
  );
};

export default UploadObserverDocument;
