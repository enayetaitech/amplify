"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Badge } from "components/ui/badge";
import { Plus, XIcon } from "lucide-react";
import { ITag } from "@shared/interface/TagInterface";
import api from "lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CreateTagModal from "./CreateTagModal";
import CustomButton from "components/shared/CustomButton";
import { toast } from "sonner";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { useParams } from "next/navigation";

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
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<ITag[]>(existingTags);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // For confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<ITag | null>(null);

  // Fetch all available tags
  const { data: allTags = [] } = useQuery<ITag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ITag[]>>(
        `/api/v1/tags/project/${id}`
      );
      return res.data.data;
    },
  });

  // Delete a tag globally
  const deleteTag = useMutation<void, Error, string>({
    mutationFn: async (tagId) => {
      await api.delete(`/api/v1/tags/${tagId}`);
    },
    onSuccess: (_, tagId) => {
      // Remove from local selection
      setSelectedTags((st) => st.filter((t) => t._id !== tagId));
      // Re-fetch tags list and project
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Tag deleted");
    },
    onError: (err) => {
      toast.error(`Failed to delete tag: ${err.message}`);
    },
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

  const handleDeleteClick = (tag: ITag) => {
    setTagToDelete(tag);
    setConfirmOpen(true);
  };

  const handleConfirmYes = () => {
    if (tagToDelete) {
      deleteTag.mutate(tagToDelete._id);
      setTagToDelete(null);
    }
    setConfirmOpen(false);
  };

  const handleConfirmCancel = () => {
    setTagToDelete(null);
    setConfirmOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center pt-5">
              <DialogTitle className="text-custom-dark-blue-1">
                Assign Tags
              </DialogTitle>
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
                  onClick={() => handleDeleteClick(tag)}
                  className="ml-1 h-4 w-4 cursor-pointer"
                  style={{ pointerEvents: "all" }}
                />
              </Badge>
            ))}
            {!selectedTags.length && (
              <p className="text-sm text-gray-500">No tags assigned</p>
            )}
          </div>

          {/* Quick-add from existing */}
          <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-auto">
            {allTags
              .filter((t) => !selectedTags.some((st) => st._id === t._id))
              .map((tag) => (
                <Badge
                  key={tag._id}
                  className="cursor-pointer hover:bg-blue-200"
                  onClick={() => setSelectedTags((st) => [...st, tag])}
                >
                  {tag.title}
                </Badge>
              ))}
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

      <ConfirmationModalComponent
        open={confirmOpen}
        onCancel={handleConfirmCancel}
        onYes={handleConfirmYes}
        heading="Delete Tag?"
        text={`Are you sure you want to delete “${tagToDelete?.title}”? This cannot be undone.`}
      />
    </>
  );
}
