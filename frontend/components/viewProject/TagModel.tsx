"use client";

import React, { useState, useEffect } from "react";
// removed shadcn Dialog for a custom modal overlay
import { Badge } from "components/ui/badge";
import { Plus, XIcon } from "lucide-react";
import { ITag } from "@shared/interface/TagInterface";
import api from "lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CreateTagModal from "./CreateTagModal";
import { toast } from "sonner";
import ConfirmationModalComponent from "components/shared/ConfirmationModalComponent";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
// import { useParams } from "next/navigation";
import { useGlobalContext } from "context/GlobalContext";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";

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
  // keep params if needed later; currently not used after switch to user-level tags
  // const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<ITag[]>(existingTags);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { user } = useGlobalContext();
  const [tagSearch, setTagSearch] = useState("");

  // For confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<ITag | null>(null);

  // Fetch all available tags for this user (central tag list)
  const { data: userTags = [] } = useQuery<ITag[]>({
    queryKey: ["user-tags", user?._id],
    enabled: Boolean(user?._id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ITag[]>>(
        `/api/v1/tags/user/${user!._id}`
      );
      return res.data.data;
    },
  });

  const assignableTags = userTags.filter(
    (t) => !selectedTags.some((st) => st._id === t._id)
  );

  const filteredTags = React.useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return assignableTags;
    return assignableTags.filter((t) => t.title.toLowerCase().includes(q));
  }, [assignableTags, tagSearch]);

  useEffect(() => {
    if (!isPickerOpen) setTagSearch("");
  }, [isPickerOpen]);

  // Assign a tag to the project
  const assignTag = useMutation<void, Error, ITag>({
    mutationFn: async (tag) => {
      await api.patch(`/api/v1/projects/update-tags`, {
        projectId,
        tagsToAdd: [tag._id],
      });
    },
    onSuccess: (_, tag) => {
      setSelectedTags((st) => [...st, tag]);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Tag assigned to project");
    },
    onError: (err) => {
      toast.error(`Failed to assign tag: ${err.message}`);
    },
  });

  // Remove a tag from the project (unassign only)
  const unassignTag = useMutation<void, Error, string>({
    mutationFn: async (tagId) => {
      await api.patch(`/api/v1/projects/update-tags`, {
        projectId,
        tagsToRemove: [tagId],
      });
    },
    onSuccess: (_, tagId) => {
      setSelectedTags((st) => st.filter((t) => t._id !== tagId));
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Tag removed from project");
    },
    onError: (err) => {
      toast.error(`Failed to remove tag: ${err.message}`);
    },
  });

  // reset when opening
  useEffect(() => {
    if (open) setSelectedTags(existingTags);
  }, [open, existingTags]);

  // when a new tag is created, add it to user cache + selection
  const handleNewTag = (tag: ITag) => {
    if (user?._id) {
      queryClient.setQueryData<ITag[]>(["user-tags", user._id], (old = []) => [
        ...old,
        tag,
      ]);
    }
    setSelectedTags((st) => [...st, tag]);
    setIsCreateOpen(false);
  };

  const handleDeleteClick = (tag: ITag) => {
    setTagToDelete(tag);
    setConfirmOpen(true);
  };

  const handleConfirmYes = () => {
    if (tagToDelete) {
      unassignTag.mutate(tagToDelete._id);
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
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg m-4">
            <div className="flex justify-between items-center">
              <h2 className="text-custom-dark-blue-1 text-lg font-semibold">
                Assign Tags
              </h2>
              <XIcon
                className="h-5 w-5 cursor-pointer"
                onClick={() => onOpenChange(false)}
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button
                className=" bg-custom-teal hover:bg-custom-dark-blue-1"
                onClick={() => setIsPickerOpen((v) => !v)}
              >
                Add Tag
              </Button>
            </div>

            {isPickerOpen && (
              <div
                className="mt-1 w-full bg-white shadow-sm rounded-lg transition-all duration-200 ease-out"
                style={{ animation: "dropdownFade 150ms ease-out" }}
              >
                <div className="p-2 border-b">
                  <Input
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search tags"
                  />
                </div>
                <div className="max-h-56 overflow-auto p-2">
                  {filteredTags.length === 0 ? (
                    <p className="px-1 py-2 text-sm text-gray-500">
                      No tags found
                    </p>
                  ) : (
                    filteredTags.map((tag) => (
                      <div
                        key={tag._id}
                        className="flex items-center gap-2 px-2 py-1 c"
                        onClick={() => {
                          assignTag.mutate(tag);
                          setIsPickerOpen(false);
                        }}
                      >
                        <Badge
                          className="flex items-center w-full text-white p-1 pl-2 cursor-pointer"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.title}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t p-2">
                  <Button
                    className="w-full bg-custom-teal hover:bg-custom-dark-blue-1"
                    onClick={() => {
                      setIsPickerOpen(false);
                      setIsCreateOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create tag
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <h1 className="text-sm font-semibold">Existing Tags: </h1>
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
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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
        heading="Remove Tag from Project?"
        text={`Are you sure you want to remove “${tagToDelete?.title}” from this project?`}
      />
    </>
  );
}
