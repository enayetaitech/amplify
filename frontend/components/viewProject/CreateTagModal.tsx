"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { ITag } from "@shared/interface/TagInterface";
import api from "lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGlobalContext } from "context/GlobalContext";
import { toast } from "sonner";
import CustomButton from "components/shared/CustomButton";
import { AxiosError } from "axios";

interface CreateTagModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (tag: ITag) => void;
}

const COLORS = [
  "#28a745",
  "#ffc107",
  "#007bff",
  "#6f42c1",
  "#343a40",
  "#c3e6cb",
  "#ffeeba",
  "#bee5eb",
  "#f5c6cb",
  "#d6d8db",
];

export default function CreateTagModal({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: CreateTagModalProps) {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const create = useMutation<ApiResponse<ITag>, AxiosError<ApiResponse<{ message: string }>>, Partial<ITag>>({
    mutationFn: async (payload) => {
      const res = await api.post<ApiResponse<ITag>>("/api/v1/tags", payload);
      return res.data;
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Tag created");
      onCreated(data);
      setTitle("");
      setColor(COLORS[0]);
    },
     onError: (err) => {
    
    const msg =
      err.response?.data?.message ??
      err.message;
    console.error("Error creating tag:", err);
    toast.error(msg);
  },
  });

  const handleSave = () => {
    create.mutate({
      title,
      color,
      createdBy: user!._id,
      projectId,
    });
  };

  const isSaving = create.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tag name"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Colors</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <span
                  key={c}
                  className={`h-6 w-6 rounded-full cursor-pointer border-2 ${
                    c === color ? "border-black" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preview</label>
            <div className="p-4 border rounded">
              <Badge
                className="px-4 py-2 text-white"
                style={{ backgroundColor: color }}
              >
                {title || "Your Tag"}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <CustomButton
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="bg-custom-teal hover:bg-custom-dark-blue-2"
          >
            {isSaving ? "Saving…" : "Save"}
          </CustomButton>
         
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
