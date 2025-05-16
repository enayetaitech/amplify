"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Plus, XIcon } from "lucide-react";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { ITag } from "@shared/interface/TagInterface";
import api from "lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CreateTagModal from "./CreateTagModal";
import CustomButton from "components/shared/CustomButton";

interface TagModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTags: ITag[];
}

export default function TagModal({
  projectId,
  open,
  onOpenChange,
  existingTags,
}: TagModalProps) {
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<ITag[]>(existingTags);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch all available tags
  const { data: allTags = [] } = useQuery<ITag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ITag[]>>("/api/v1/tags");
      return res.data.data;
    },
  });

  // Mutation: save project.tags
  const saveTags = useMutation<
    ApiResponse<unknown>,
    Error,
    { projectId: string; tags: string[] }
  >({
    mutationFn: ({ projectId, tags }) =>
      api.patch("/api/v1/projects/edit-project", { projectId, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Tags updated");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // reset when opening
  useEffect(() => {
    if (open) setSelectedTags(existingTags);
  }, [open, existingTags]);

  // when a new tag is created, add it to both caches + selection
  const handleNewTag = (tag: ITag) => {
    queryClient.setQueryData<ITag[]>(["tags"], (old = []) => [...old, tag]);
    setSelectedTags((st) => [...st, tag]);
    setIsCreateOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center pt-5">
              <DialogTitle className="text-custom-dark-blue-1">Assign Tags</DialogTitle>
              <CustomButton
                icon={<Plus />}
                className="bg-custom-teal 
            hover:bg-custom-dark-blue-1
            "
                onClick={() => setIsCreateOpen(true)}
              >
                Add New Tag
              </CustomButton>
            </div>
          </DialogHeader>

          {/* Currently assigned tags */}
          <div className="flex flex-wrap gap-2 mb-4 pt-5">
            {selectedTags.map((tag) => (
              <Badge
                key={tag._id}
                className="flex items-center text-white p-1 pl-2"
                style={{ backgroundColor: tag.color }}
              >
                {tag.title}
                <XIcon
                  className="ml-1 h-4 w-4 cursor-pointer"
                  onClick={() =>
                    setSelectedTags((st) => st.filter((x) => x._id !== tag._id))
                  }
                />
              </Badge>
            ))}
            {!selectedTags.length && (
              <p className="text-sm text-gray-500">No tags assigned</p>
            )}
          </div>

          

          
        </DialogContent>
      </Dialog>
      {/* nested create-tag dialog */}
      <CreateTagModal
        projectId={projectId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleNewTag}
      />
    </>
  );
}
