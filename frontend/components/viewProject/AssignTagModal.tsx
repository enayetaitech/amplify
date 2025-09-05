import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { ScrollArea } from "components/ui/scroll-area";
import CreateTag from "./CreateTag";

interface Tag {
  _id: string;
  name: string;
  color: string;
  description?: string;
}

interface Project {
  _id: string;
  name: string;
  tags: Tag[];
}

interface AssignTagModalProps {
  userId: string;
  project: Project;
  onClose: () => void;
  fetchProjects: () => void;
  page: number;
  open: boolean;
}

const AssignTagModal: React.FC<AssignTagModalProps> = ({
  userId,
  project,
  onClose,
  fetchProjects,
  page,
  open,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);

console.log("page", page)
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/tags/getAllTags/${userId}`
        );
        const data = await response.json();
        setTags(data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [userId, refreshTrigger]);

  const handleAddTag = (tagId: string) => {
    const isAssigned = project.tags.some((tag) => tag._id === tagId);

    if (isAssigned) {
      // Tag is currently assigned, mark for removal or undo removal
      setTagsToRemove((prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId)
          : [...prev, tagId]
      );

      // If it was previously added, remove it from the "to add" list
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    } else {
      // Tag is not assigned, add to selected tags or remove from "to remove"
      setSelectedTagIds((prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId)
          : [...prev, tagId]
      );

      // If it was marked for removal, undo that
      setTagsToRemove((prev) => prev.filter((id) => id !== tagId));
    }
  };

  const getContrastColor = (bgColor: string): string => {
    // Remove the "#" if it exists
    const color = bgColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5 ? "#FFFFFF" : "#000000";
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/project/assignTagsToProject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tagsToAdd: selectedTagIds,
            tagsToRemove,
            projectId: project._id,
          }),
        }
      );

      if (response.ok) {
        fetchProjects();
        onClose();
      } else {
        console.error("Failed to update tags");
      }
    } catch (error) {
      console.error("Error updating tags:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-teal-600">
              Assign Tag
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 text-4xl hover:text-gray-700"
            >
              ×
            </button>
          </DialogHeader>

          <ScrollArea className="max-h-60 overflow-y-auto pr-4">
            <div className="space-y-2">
              {tags.map((tag) => {
                const isAssigned =
                  (project.tags.some(
                    (assignedTag) => assignedTag._id === tag._id
                  ) &&
                    !tagsToRemove.includes(tag._id)) ||
                  selectedTagIds.includes(tag._id);

                return (
                  <div
                    key={tag._id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <span
                      className="px-2 py-1 rounded-full border-2 font-semibold text-sm"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: getContrastColor(tag.color),
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                    <button
                      className={`text-sm font-bold hover:underline ${
                        isAssigned ? "text-red-500" : "text-teal-600"
                      }`}
                      onClick={() => handleAddTag(tag._id)}
                    >
                      {isAssigned ? "Remove" : "Assign"}
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-end mt-4">
            <button
              className="mt-2 text-lg text-teal-600 font-bold hover:underline"
              onClick={() => setIsCreateTagModalOpen(true)}
            >
              Add New Tag
            </button>
          </div>

          <Button
            variant="default"
            onClick={handleComplete}
            className="rounded-lg text-white py-1 px-6 mt-4 bg-teal-600 hover:bg-teal-700"
          >
            Complete
          </Button>
        </DialogContent>
      </Dialog>

      {isCreateTagModalOpen && (
        <CreateTag
          userId={userId}
          onClose={() => setIsCreateTagModalOpen(false)}
          onTagCreated={() => setRefreshTrigger((prev) => prev + 1)}
          open={isCreateTagModalOpen}
        />
      )}
    </>
  );
};

export default AssignTagModal;
