// hooks/useUploadObserverDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useGlobalContext } from "../context/GlobalContext";
import api from "../lib/api";
import { toast } from "sonner";

interface UploadInput {
  file: File;
}

export default function useUploadObserverDocument(
  projectId: string,
  onSuccessCallback?: () => void
) {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, UploadInput>({
    mutationFn: ({ file }) => {
      if (!user) {
        return Promise.reject(new Error("You must be logged in"));
      }
      if (!file) {
        return Promise.reject(new Error("Please select a file"));
      }
      // sessionId no longer required for project-scoped docs

      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      // sessionId removed
      formData.append("addedBy", user._id);
      formData.append("addedByRole", user.role);

      return api.post("/api/v1/observerDocuments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },

    onSuccess: () => {
      toast.success("Document uploaded successfully.");
      queryClient.invalidateQueries({ queryKey: ["observerDocs", projectId] });
      onSuccessCallback?.();
    },
  });
}
