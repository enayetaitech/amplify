// components/projects/sessions/AddModeratorModal.tsx
"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import CustomButton from "components/shared/CustomButton";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IModerator } from "@shared/interface/ModeratorInterface";
import { useParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";

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
  adminAccess: boolean;
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
    adminAccess: false,
  });
 


  const addModeratorMutation = useMutation<
    ApiResponse<IModerator>,
    Error,
    ModeratorFormData & { projectId: string; roles: string[]}
  >({
    mutationFn: (payload) =>
      api
        .post<ApiResponse<IModerator>>(
          `/api/v1/moderators/add-moderator`,
          payload
        )
        .then((res) => res.data),

    onSuccess: () => {
      toast.success("Moderator added successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        companyName: "",
        adminAccess: false,
      });
      onClose();
      onSuccess?.();
    },

    onError: (error) => {
      console.log('error',error)
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

 const validateFields = (): boolean => {
  const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  const companyRegex = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  const cleanedData: ModeratorFormData = {
    firstName: formData.firstName.trim().replace(/\s+/g, " "),
    lastName: formData.lastName.trim().replace(/\s+/g, " "),
    email: formData.email.trim(),
    companyName: formData.companyName.trim().replace(/\s+/g, " "),
    adminAccess: formData.adminAccess,
  };

  // Required field check
  for (const [key, value] of Object.entries(cleanedData)) {
    if (
      key !== "adminAccess" &&
      typeof value === "string" &&
      value.trim() === ""
    ) {
      toast.error(`${formatFieldLabel(key)} is mandatory.`);
      return false;
    }
  }

  if (!nameRegex.test(cleanedData.firstName)) {
    toast.error("First Name must contain only alphabets and single spaces.");
    return false;
  }

  if (!nameRegex.test(cleanedData.lastName)) {
    toast.error("Last Name must contain only alphabets and single spaces.");
    return false;
  }

  if (!companyRegex.test(cleanedData.companyName)) {
    toast.error("Company Name must contain only alphanumeric characters and single spaces.");
    return false;
  }

  if (!emailRegex.test(cleanedData.email)) {
  toast.error("Please enter a valid email address.");
  return false;
}


  return true;
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    if (!validateFields()) return;
    
    const roles = formData.adminAccess ? ["Moderator", "Admin"] : ["Moderator"];

    const cleanedPayload = {
    ...formData,
    firstName: formData.firstName.trim().replace(/\s+/g, " "),
    lastName: formData.lastName.trim().replace(/\s+/g, " "),
    email: formData.email.trim(),
    companyName: formData.companyName.trim().replace(/\s+/g, " "),
    roles,
    projectId,
  };

  addModeratorMutation.mutate(cleanedPayload);
  };

  const formatFieldLabel = (field: string): string => {
  switch (field) {
    case "firstName":
      return "First Name";
    case "lastName":
      return "Last Name";
    case "email":
      return "Email";
    case "companyName":
      return "Company Name";
    default:
      return field;
  }
};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Moderator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
         {(["firstName", "lastName", "email", "companyName"] as const).map(
  (field) => {
    const label =
      field === "firstName"
        ? "First Name*"
        : field === "lastName"
        ? "Last Name*"
        : field === "companyName"
        ? "Company Name*"
        : "Email*";

    return (
      <div key={field}>
        <Label className="capitalize">{label}</Label>
        <Input
          name={field}
          placeholder={`Enter ${label}`}
          value={formData[field]}
          onChange={handleChange}
          className="mt-3"
          required
          disabled={addModeratorMutation.isPending}
        />
      </div>
    );
  }
)}


          <div className="flex items-center space-x-3 gap-3">
            <Label className="m-0">Admin Access</Label>
            <Switch
              checked={formData.adminAccess}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, adminAccess: checked }))
              }
            />
            <span className="text-sm font-medium">
              {formData.adminAccess ? "Yes" : "No"}
            </span>
          </div>

<div>
  <p className="text-sm"><strong>Note:</strong> All Admins can add, start, or delete meetings and materials, and can incur charges to your account for this project.</p>
</div>
          <div className="flex justify-end pt-2">
            <CustomButton
              onClick={handleSubmit}
              disabled={addModeratorMutation.isPending}
              className="bg-custom-orange-2 hover:bg-custom-orange-1 text-white"
            >
              {addModeratorMutation.isPending ? "Saving..." : "Save"}
            </CustomButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddModeratorModal;
