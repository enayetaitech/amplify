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
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import CustomButton from "components/shared/CustomButton";
import { Download, Trash2, Upload, ChevronsUpDown } from "lucide-react";
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
import { useGlobalContext } from "context/GlobalContext";
import { useProject } from "hooks/useProject";
import { Button } from "components/ui/button";
import { useMemo } from "react";

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

  const { user } = useGlobalContext();

  // 2️⃣ all hooks go here, top-level, unconditionally
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"displayName">("displayName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 10;
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{
    id?: string;
    name?: string;
  } | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);

  // Placeholder for observer documents; actual query initialized below
  let isLoading = false;
  let error: Error | null = null;

  // Fetch project to check recordingAccess
  const { data: projectData, isLoading: projectLoading } = useProject(
    projectId || undefined
  );

  // Fetch project team to check user's role in this specific project
  const { data: projectTeam } = useQuery<
    {
      data: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        roles: string[];
        adminAccess: boolean;
      }[];
    },
    Error
  >({
    queryKey: ["projectTeam", projectId],
    queryFn: () =>
      api
        .get(`/api/v1/moderators/project/${projectId}`)
        .then((res) => res.data),
    enabled: !!projectId && !!user?.email,
  });

  // Determine project-scoped role for current user
  const teamMember = projectTeam?.data?.find(
    (member) => member.email.toLowerCase() === user?.email?.toLowerCase()
  );

  const isProjectObserver = Boolean(
    teamMember &&
      teamMember.roles?.includes("Observer") &&
      !teamMember.adminAccess &&
      !teamMember.roles?.includes("Admin") &&
      !teamMember.roles?.includes("Moderator")
  );

  const recordingAccessFlag = projectData?.recordingAccess;
  const isObserverRestricted =
    isProjectObserver &&
    projectLoading === false &&
    recordingAccessFlag === false;

  // Observer documents query: disabled when observer is restricted
  const observerQuery = useQuery<
    { data: IObserverDocument[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["observerDocs", projectId, page, sortBy, sortOrder],
    queryFn: () =>
      api
        .get<{ data: IObserverDocument[]; meta: IPaginationMeta }>(
          `/api/v1/observerDocuments/project/${projectId}`,
          { params: { page, limit, sortBy, sortOrder } }
        )
        .then((res) => res.data),
    enabled: !!projectId && !isObserverRestricted,
    placeholderData: keepPreviousData,
  });

  const data = observerQuery.data;
  isLoading = observerQuery.isLoading;
  error = observerQuery.error ?? null;

  // Check if user is Admin or Moderator in THIS specific project
  const canDelete = useMemo(() => {
    if (!user?.email || !projectTeam?.data) return false;

    const teamMember = projectTeam.data.find(
      (member) => member.email.toLowerCase() === user.email.toLowerCase()
    );

    if (!teamMember) return false;

    // Check if user has Admin or Moderator role in this project
    return (
      teamMember.adminAccess ||
      teamMember.roles?.includes("Admin") ||
      teamMember.roles?.includes("Moderator")
    );
  }, [user?.email, projectTeam?.data]);

  // 2️⃣ Mutation for single-download
  const downloadOneMutation = useMutation<string, unknown, string>({
    // Using onMutate so we can fire off the download immediately
    mutationFn: (id) => Promise.resolve(id),
    onMutate: (id) => {
      const base = api.defaults.baseURL || "";
      window.open(`${base}/api/v1/observerDocuments/${id}/download`, "_blank");
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
    mutationFn: (id) => api.delete(`/api/v1/observerDocuments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["observerDocs", projectId, page],
      });
      setDeleteOpen(false);
      setToDelete(null);
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

  // If observer is restricted, show explicit notice instead of table
  if (isObserverRestricted) {
    return (
      <ComponentContainer>
        <div className="p-6 text-center">
          <HeadingBlue25px>Observer Documents</HeadingBlue25px>
          <p className="mt-4 text-gray-600">
            You are not permitted to see the observer documents for this
            project.
          </p>
        </div>
      </ComponentContainer>
    );
  }

  const totalPages = data?.meta.totalPages ?? 0;

  // format bytes as KB/MB
  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${bytes} B`;

  const truncate = (s: string, n = 30) =>
    s && s.length > n ? `${s.slice(0, n)}…` : s;

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

  const handleHeaderClick = (field: "displayName"): void => {
    const nextOrder: "asc" | "desc" =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(nextOrder);
    setPage(1);
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
              onClose={() => {
                setUploadOpen(false);
              }}
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
                      className="cursor-pointer bg-custom-orange-2 text-white hover:bg-custom-orange-1 border-0"
                    >
                      {downloadAllMutation.isPending
                        ? "Downloading..."
                        : "Download All"}
                    </CustomButton>
                  </div>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center space-x-1 cursor-pointer"
                    onClick={() => handleHeaderClick("displayName")}
                  >
                    <span>File Name</span>
                    <ChevronsUpDown
                      className={
                        "h-4 w-4 " +
                        (sortBy === "displayName"
                          ? "text-custom-dark-blue-1"
                          : "text-gray-400")
                      }
                    />
                  </button>
                </TableHead>
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
                    <TableCell>
                      {truncate(String(del.displayName || ""), 30)}
                    </TableCell>
                    <TableCell>{formatSize(del.size)}</TableCell>
                    <TableCell>
                      {`${
                        (del.addedBy as unknown as PopulatedUser).firstName
                      } ${(del.addedBy as unknown as PopulatedUser).lastName}`}
                    </TableCell>
                    <TableCell className="text-center flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => downloadOneMutation.mutate(del._id)}
                        disabled={downloadOneMutation.isPending}
                        title="Download document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {/* Delete - Only for Admin/Moderator */}
                      {canDelete && (
                        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 cursor-pointer"
                              onClick={() => {
                                setToDelete({
                                  id: del._id,
                                  name: del.displayName,
                                });
                                setDeleteOpen(true);
                              }}
                              disabled={deleteMutation.isPending}
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Confirm delete</DialogTitle>
                            </DialogHeader>
                            <p>
                              Are you sure you want to delete{" "}
                              {toDelete?.name
                                ? `"${toDelete.name}"`
                                : "this document"}
                              ?
                            </p>
                            <DialogFooter>
                              <CustomButton
                                variant="outline"
                                onClick={() => {
                                  setDeleteOpen(false);
                                  setToDelete(null);
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                Cancel
                              </CustomButton>
                              <CustomButton
                                className="ml-2 bg-red-600 text-white"
                                onClick={() =>
                                  toDelete?.id &&
                                  deleteMutation.mutate(toDelete.id)
                                }
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending
                                  ? "Deleting..."
                                  : "Delete"}
                              </CustomButton>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
