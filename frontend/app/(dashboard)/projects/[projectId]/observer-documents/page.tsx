"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { IObserverDocument } from "@shared/interface/ObserverDocumentInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";
import { Download, Trash2, Upload } from "lucide-react";
import CustomPagination from "components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { Checkbox } from "components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import UploadObserverDocument from "components/projects/observerDocuments/UploadObserverDocuments";

type CheckedState = boolean | "indeterminate";

interface PopulatedUser {
  firstName: string;
  lastName: string;
  role: string;
}

const ObserverDocuments = () => {
  const params = useParams();
  const projectId =
    !params.projectId || Array.isArray(params.projectId)
      ? null
      : params.projectId;

  // 2️⃣ all hooks go here, top-level, unconditionally
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 10;
  const queryClient = useQueryClient();

  const [uploadOpen, setUploadOpen] = useState(false);

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

     // 2️⃣ Mutation for single-download
  const downloadOneMutation = useMutation<string, unknown, string>({
    // Using onMutate so we can fire off the download immediately
    mutationFn: (id) => Promise.resolve(id),
    onMutate: (id) => {
      window.open(
        `https://bamplify.hgsingalong.com/api/v1/observerDocuments/${id}/download`,
        "_blank"
      );
    },
  });

    // bulk-download
   const downloadAllMutation = useMutation<string[], unknown, string[]>({
    mutationFn: (ids) =>
      api
        .post<{
          success: boolean;
          message: string;
          data: Array<{ key: string; url: string }>;
        }>("/api/v1/observerDocuments/download-bulk", { ids })
        .then((res) => res.data.data.map((d) => d.url)),
    onSuccess: (urls) => {
      
      urls.forEach((url) => window.open(url, "_blank"));
    },
    onError: (err) => {
      console.error("Bulk download failed", err);
    },
  });

   // DELETE mutation
  const deleteMutation = useMutation<string, unknown, string>({
    mutationFn: (id) =>
      api.delete(`/api/v1/observerDocuments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["observerDocs", projectId, page]
      });
    },
    onError: (err) => {
      console.error("Delete failed", err);
    },
  });

  // 3️⃣ now safe to guard
  if (!projectId) {
    return (
      <div className="p-4 text-red-600">
        <p>❗️ Invalid or missing projectId in the URL.</p>
      </div>
    );
  }

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const totalPages = data?.meta.totalPages ?? 0;

  // format bytes as KB/MB
  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${bytes} B`;

  // checkbox handlers
  const allSelected = data ? selectedIds.length === data.data.length : false;

  const toggleSelectAll = (checked: CheckedState) => {
    if (checked) {
      setSelectedIds(data?.data.map((d) => d._id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => (checked: CheckedState) => {
    const isTrue = checked === true;
    setSelectedIds((prev) =>
      isTrue ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };



  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Observer Documents</HeadingBlue25px>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <CustomButton
              icon={<Upload />}
              text="Upload"
              variant="default"
              className="bg-custom-orange-2 text-white hover:bg-custom-orange-1"
            />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Observer Document</DialogTitle>
            </DialogHeader>
            <UploadObserverDocument
              projectId={projectId}
              onClose = {() => {setUploadOpen(false)}}
            />
            <DialogFooter />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading observer documents...
        </p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      className="cursor-pointer"
                    />
                    <CustomButton
                      icon={<Download />}
                      variant="outline"
                      onClick={() => downloadAllMutation.mutate(selectedIds)}
                      disabled={
                        selectedIds.length === 0 ||
                        downloadAllMutation.isPending
                      }
                      size="sm"
                      className="cursor-pointer hover:text-custom-dark-blue-1 hover:bg-white outline-0 border-0 shadow-lg bg-white"
                    >
                      {downloadAllMutation.isPending
                        ? "Downloading..."
                        : "Download All"}
                    </CustomButton>
                  </div>
                </TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {data?.data.length ? (
                data.data.map((del) => (
                  <TableRow key={del._id}>
                    <TableCell className="w-[48px]">
                      <Checkbox
                        checked={selectedIds.includes(del._id)}
                        onCheckedChange={toggleSelectOne(del._id)}
                        aria-label={`Select ${del.displayName}`}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>{del.displayName}</TableCell>
                    <TableCell>{formatSize(del.size)}</TableCell>
                    <TableCell>
                       {((del.addedBy as unknown) as PopulatedUser).firstName}
                    </TableCell>
                     <TableCell className="text-center flex justify-center gap-2">
                      <CustomButton
                        className="bg-custom-teal hover:bg-custom-dark-blue-3 rounded-lg"
                        onClick={() =>
                          downloadOneMutation.mutate(del._id)
                        }
                        disabled={downloadOneMutation.isPending}
                      >
                        {downloadOneMutation.isPending
                          ? "Downloading..."
                          : "Download"}
                      </CustomButton>
                        {/* Delete */}
                  <CustomButton
                    size="sm"
                    className="bg-custom-orange-1 hover:bg-custom-orange-2"
                    onClick={() => deleteMutation.mutate(del._id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </CustomButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-8"
                  >
                    No deliverables found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="w-full flex justify-end  pb-5">
          <CustomPagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </ComponentContainer>
  );
};

export default ObserverDocuments;
