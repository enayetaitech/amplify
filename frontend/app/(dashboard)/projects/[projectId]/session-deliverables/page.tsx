"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "lib/api";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ISessionDeliverable } from "@shared/interface/SessionDeliverableInterface";
import ComponentContainer from "components/shared/ComponentContainer";
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import { IPaginationMeta } from "@shared/interface/PaginationInterface";
import { Tabs, TabsList, TabsTrigger } from "components/ui/tabs";
import CustomPagination from "components/shared/Pagination";

const deliverableTabs = [
  { label: "Audio",         type: "AUDIO"         },
  { label: "Video",         type: "VIDEO"         },
  { label: "Transcripts",   type: "TRANSCRIPT"    },
  { label: "Backroom Chat", type: "BACKROOM_CHAT" },
  { label: "Session Chat",  type: "SESSION_CHAT"  },
  { label: "Whiteboards",   type: "WHITEBOARD"    },
  { label: "Poll Results",  type: "POLL_RESULT"   },
];

const SessionDeliverables = () => {
  const { projectId } = useParams();
  const [page, setPage] = useState(1);
  const limit = 10;
  // track currently selected tab/type
  const [selectedType, setSelectedType] = useState(deliverableTabs[0].type);

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

 // log whenever new data arrives
  useEffect(() => {
    if (data) {
      console.log("sessionDeliverables", selectedType, data);
    }
  }, [data, selectedType]);

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <ComponentContainer>
      <div className="flex justify-between items-center bg-none pb-5 ">
        <HeadingBlue25px>Session Deliverables</HeadingBlue25px>
      </div>
      {/* Tabs */}
     <Tabs
        value={selectedType}
        onValueChange={value => {
          setSelectedType(value);
          setPage(1);
        }}
        className="mb-4"
      >
        <TabsList>
          {deliverableTabs.map(tab => (
            <TabsTrigger key={tab.type} value={tab.type} className="text-custom-dark-blue-1">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isLoading ? (
        <p className="text-custom-dark-blue-1 text-2xl text-center font-bold">
          Loading session deliverables...
        </p>
      ) : (
        <div className="pt-5 bg-custom-white space-y-2">
{data?.data.length ? (
            data.data.map((del) => (
              <div key={del._id} className="p-4 border rounded">
                <p><strong>{del.displayName}</strong></p>
                <p>Type: {del.type}</p>
                <p>Size: {del.size} bytes</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No deliverables found.</p>
          )}
     {/* ==== shadcn/ui Pagination ==== */}
      {totalPages > 1 && (
       <CustomPagination
       totalPages={totalPages}
       currentPage={page}
       onPageChange={(newPage) => {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }}
       />
      )}
        </div>
      )}
    </ComponentContainer>
  );
};

export default SessionDeliverables;


 