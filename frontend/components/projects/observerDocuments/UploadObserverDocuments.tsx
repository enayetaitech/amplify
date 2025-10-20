"use client";

import React, { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "../../../lib/api";
import CustomButton from "../../shared/CustomButton";
import { Upload } from "lucide-react";
import { ISession } from "@shared/interface/SessionInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import useUploadObserverDocument from "../../../hooks/useUploadObserverDocument";

interface UploadProps {
  projectId: string;
  onClose: () => void;
}

const UploadObserverDocument: React.FC<UploadProps> = ({
  projectId,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  // sessionId removed – project-wide documents

  // 1️⃣ Fetch all sessions for this project (no longer required for upload)
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

  void sessionsData;
  void isSessionsLoading;

  // 2️⃣ Mutation to upload the file + projectId + user info (sessionId removed)
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
        {/* Session selection removed: uploads are project-scoped */}
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
          onClick={() => file && upload({ file })}
          disabled={!file || isUploading}
          variant="default"
          className="bg-custom-orange-2 text-white hover:bg-custom-orange-1"
        />
      </div>
      {uploadError && (
        <p className="text-red-500">
          Error: {(uploadErrorObj as Error).message}
        </p>
      )}
    </div>
  );
};

export default UploadObserverDocument;
