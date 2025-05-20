// components/projects/sessions/AddModeratorModal.tsx
"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/dialog";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { useParams } from "next/navigation";


interface AddModeratorModalProps {
  open: boolean;
  onClose: () => void;

  onSuccess?: () => void;
}

interface ModeratorFormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
}

const AddModeratorModal: React.FC<AddModeratorModalProps> = ({
  open,
  onClose,

  onSuccess,
}) => {
   const params = useParams();
    // coerce it into a string (or throw if missing)
    if (!params.projectId || Array.isArray(params.projectId)) {
      throw new Error("projectId is required and must be a string");
    }
    const projectId = params.projectId;
  const [formData, setFormData] = useState<ModeratorFormData>({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
  });

  const addModeratorMutation = useMutation<
  ApiResponse<IModerator>,
  Error,
  ModeratorFormData & { projectId: string }
>({
    mutationFn: (payload) =>
      api
        .post<ApiResponse<IModerator>>(`/api/v1/moderators/add-moderator`, payload)
        .then((res) => res.data),

    onSuccess: () => {
      toast.success("Moderator added successfully!");
      setFormData({ firstName: "", lastName: "", email: "", companyName: "" });
      onClose();
      onSuccess?.();
    },

    onError: (err) => {
      toast.error(err.message || "Failed to add moderator");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
     const allFieldsFilled = Object.values(formData).every((val) => val.trim() !== "");
  if (!allFieldsFilled) {
    toast.error("Please fill out all required fields.");
    return;
  }
    addModeratorMutation.mutate({ ...formData, projectId });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Study Moderator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {(Object.keys(formData) as (keyof ModeratorFormData)[]).map((field) => (
            <div key={field}>
              <Label className="capitalize">{field}</Label>
              <Input
                name={field}
                placeholder={`Enter ${field}`}
                 value={formData[field]}
                onChange={handleChange}
                className="mt-3"
                required
              />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <CustomButton
              onClick={handleSubmit}
              disabled={addModeratorMutation.isPending}
              className="bg-custom-orange-2 hover:bg-custom-orange-1 text-white"
            >
              {addModeratorMutation.isPending ? "Adding..." : "Add Moderator"}
            </CustomButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddModeratorModal;
