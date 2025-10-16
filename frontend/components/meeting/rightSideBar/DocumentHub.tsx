"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import { IObserverDocument } from "@shared/interface/ObserverDocumentInterface";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { Button } from "components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
// session selection UI removed – uploads are project-scoped
import { Checkbox } from "components/ui/checkbox";
import {
  FileText,
  Folder,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@radix-ui/react-select";
import { useGlobalContext } from "context/GlobalContext";

const bytes = (n: number) =>
  n >= 1024 * 1024
    ? `${(n / (1024 * 1024)).toFixed(1)} MB`
    : n >= 1024
    ? `${(n / 1024).toFixed(1)} KB`
    : `${n} B`;

export default function DocumentHub({ projectId }: { projectId: string }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useGlobalContext();

  const { data, isLoading, error } = useQuery<
    { data: IObserverDocument[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["observerDocs", projectId, page],
    queryFn: () =>
      api
        .get<{ data: IObserverDocument[]; meta: IPaginationMeta }>(
          `/api/v1/observerDocuments/project/${projectId}`,
          { params: { page, limit } }
        )
        .then((res) => res.data),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });

  // single download via redirect endpoint
  const downloadOne = (id: string) => {
    const base = api.defaults.baseURL || "";
    window.open(`${base}/api/v1/observerDocuments/${id}/download`, "_blank");
  };

  // bulk download removed

  const deleteMutation = useMutation<void, unknown, string>({
    mutationFn: (id) => api.delete(`/api/v1/observerDocuments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observerDocs", projectId] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  // Upload dialog local state
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation<void, Error, { file: File }>({
    mutationFn: async ({ file }) => {
      if (!user) throw new Error("You must be logged in");
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("addedBy", user._id as string);
      form.append("addedByRole", user.role as string);
      await api.post("/api/v1/observerDocuments", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      setUploadOpen(false);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["observerDocs", projectId] });
    },
    onError: (e) => toast.error(e?.message || "Upload failed"),
  });

  const allSelected = data ? selectedIds.length === data.data.length : false;
  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) setSelectedIds(data?.data.map((d) => d._id) || []);
    else setSelectedIds([]);
  };
  const toggleOne = (id: string) => (checked: boolean | "indeterminate") => {
    const isTrue = checked === true;
    setSelectedIds((prev) =>
      isTrue ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <Card className=" border-none shadow-none">
        <CardHeader className=" px-3 flex items-center justify-between">
          <CardTitle className="flex  items-center gap-2 text-sm text-[#00293C]">
            <FileText className="h-4 w-4" />
            DOCUMENT HUB
          </CardTitle>
          <CardAction>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="orange"
                  className="text-sm px-4 py-[1px] rounded-full"
                >
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Observer Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="default"
                      onClick={() => file && uploadMutation.mutate({ file })}
                      disabled={!file || uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Uploading…" : "Upload"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
        <Separator />

        <CardContent className="px-3 pb-3">
          {error ? (
            <div className="text-red-500 text-sm">{error.message}</div>
          ) : isLoading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="bg-custom-gray-2 rounded-xl  p-2">
              <div className="flex items-center justify-between px-3 text-[12px] text-gray-600">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                  <span>Name</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Size</span>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-custom-gray-2 p-2">
                <div className="max-h-60 overflow-y-auto">
                  {(data?.data || []).map((d) => (
                    <div
                      key={d._id}
                      className="flex items-center justify-between px-2 py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox
                          checked={selectedIds.includes(d._id)}
                          onCheckedChange={toggleOne(d._id)}
                          className="cursor-pointer"
                          aria-label={`Select ${d.displayName}`}
                        />
                        <Folder className="h-4 w-4 shrink-0" />
                        <button
                          type="button"
                          className="truncate text-sm text-left hover:underline"
                          onClick={() => downloadOne(d._id)}
                          title="Download"
                        >
                          {d.displayName}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600">
                          {bytes(d.size)}
                        </span>
                        <button
                          type="button"
                          className="text-red-500 cursor-pointer"
                          aria-label="Delete file"
                          onClick={() => deleteMutation.mutate(d._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-600">
                    Page {page} {totalPages ? `of ${totalPages}` : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!!totalPages && page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
