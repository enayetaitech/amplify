"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { ISessionDeliverable } from "@shared/interface/SessionDeliverableInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/shared/HeadingBlue25pxComponent";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { Tabs, TabsList, TabsTrigger } from "components/ui/tabs";
import CustomPagination from "components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Checkbox } from "components/ui/checkbox";
import CustomButton from "components/shared/CustomButton";
import { Download } from "lucide-react";

const deliverableTabs = [
  { label: "Video", type: "VIDEO" },
  { label: "Backroom Chat", type: "BACKROOM_CHAT" },
  { label: "Session Chat", type: "SESSION_CHAT" },
  { label: "Whiteboards", type: "WHITEBOARD" },
  { label: "Poll Results", type: "POLL_RESULT" },
];

type CheckedState = boolean | "indeterminate";

const SessionDeliverables = () => {
  const { projectId } = useParams();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedType, setSelectedType] = useState(deliverableTabs[0].type);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery<
    { data: ISessionDeliverable[]; meta: IPaginationMeta },
    Error
  >({
    queryKey: ["sessionDeliverables", projectId, page, selectedType],
    queryFn: () =>
      api
        .get<{ data: ISessionDeliverable[]; meta: IPaginationMeta }>(
          `/api/v1/sessionDeliverables/project/${projectId}`,
          { params: { page, limit, type: selectedType } }
        )
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  // 2️⃣ Mutation for single-download
  const downloadOneMutation = useMutation<string, unknown, string>({
    // Using onMutate so we can fire off the download immediately
    mutationFn: (id) => Promise.resolve(id),
    onMutate: (id) => {
      const base = api.defaults.baseURL || "";
      window.open(
        `${base}/api/v1/sessionDeliverables/${id}/download`,
        "_blank"
      );
    },
  });

  const downloadAllMutation = useMutation<string[], unknown, string[]>({
    mutationFn: (ids) =>
      api
        .post<{
          success: boolean;
          message: string;
          data: Array<{ key: string; url: string }>;
        }>("/api/v1/sessionDeliverables/download-bulk", { ids })
        .then((res) => res.data.data.map((d) => d.url)),
    onSuccess: (urls) => {
      urls.forEach((url) => window.open(url, "_blank"));
    },
    onError: (err) => {
      console.error("Bulk download failed", err);
    },
  });

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
        <HeadingBlue25px>Session Deliverables</HeadingBlue25px>
      </div>
      {/* Tabs */}
      <div className="w-full overflow-x-auto">
        <Tabs
          value={selectedType}
          onValueChange={(value) => {
            setSelectedType(value);
            setPage(1);
          }}
          className="mb-4 w-full"
        >
          <TabsList className="w-full  p-1 bg-white rounded-none">
            {deliverableTabs.map((tab) => (
              <TabsTrigger
                key={tab.type}
                value={tab.type}
                className={`
        flex-1 text-center cursor-pointer
        border-b-3 border-transparent rounded-none bg-white
         text-gray-600 
         data-[state=active]:border-b-custom-dark-blue-1
         data-[state=active]:text-custom-dark-blue-1
       `}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading session deliverables...
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
                <TableHead>Deliverable</TableHead>
                <TableHead>Size</TableHead>
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
                    <TableCell className="text-center">
                      <CustomButton
                        className="bg-custom-dark-blue-3 hover:bg-custom-dark-blue-2 rounded-lg"
                        onClick={() => downloadOneMutation.mutate(del._id)}
                        disabled={downloadOneMutation.isPending}
                      >
                        {downloadOneMutation.isPending
                          ? "Downloading..."
                          : "Download"}
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

export default SessionDeliverables;
