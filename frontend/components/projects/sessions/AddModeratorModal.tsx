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
import {
  alphanumericSingleSpace,
  alphaSingleSpace,
  emailChars,
  lettersAndSpaces,
  noLeadingSpace,
  noMultipleSpaces,
  noTrailingSpace,
  validate,
} from "schemas/validators";
import { makeOnChange } from "utils/validationHelper";

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
    ModeratorFormData & { projectId: string; roles: string[] }
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
      console.log("error", error);
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const handleSubmit = () => {
    const roles = formData.adminAccess ? ["Moderator", "Admin"] : ["Moderator"];

    const clean = (s: string) => s.trim().replace(/\s+/g, " ");
    const data = {
      ...formData,
      firstName: clean(formData.firstName),
      lastName: clean(formData.lastName),
      companyName: clean(formData.companyName),
      email: formData.email.trim(),
    };
    if (
      !validate(data.firstName, [
        noLeadingSpace,
        noTrailingSpace,
        alphaSingleSpace,
      ]) ||
      !validate(data.lastName, [
        noLeadingSpace,
        noTrailingSpace,
        alphaSingleSpace,
      ]) ||
      !validate(data.companyName, [
        noLeadingSpace,
        noTrailingSpace,
        noMultipleSpaces,
        alphanumericSingleSpace,
      ]) ||
      !emailChars(data.email)
    ) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    addModeratorMutation.mutate({ ...data, roles, projectId });
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      adminAccess: false,
    });
    onClose(); // invoke parent close handler
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl overflow-x-auto border-0">
        <DialogHeader>
          <DialogTitle>Add Moderator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {(["firstName", "lastName", "email", "companyName"] as const).map(
            (field) => {
              const label =
                field === "firstName"
                  ? "First Name"
                  : field === "lastName"
                  ? "Last Name"
                  : field === "companyName"
                  ? "Company Name"
                  : "Email";

              return (
                <div key={field}>
                  <Label className="capitalize">{label}*</Label>
                  <Input
                    name={field}
                    placeholder={`Enter ${label}`}
                    value={formData[field]}
                    // onChange only checks everything *except* trailing‐space
                    onChange={makeOnChange(
                      field,
                      field === "firstName" || field === "lastName"
                        ? [noLeadingSpace, noMultipleSpaces, lettersAndSpaces]
                        : field === "companyName"
                        ? [
                            noLeadingSpace,
                            noMultipleSpaces,
                            alphanumericSingleSpace,
                          ]
                        : /* email */ [noLeadingSpace, emailChars],
                      field === "companyName"
                        ? "Company Name must contain only letters/numbers & single spaces."
                        : field === "email"
                        ? "Please enter a valid email address."
                        : `${label} must be letters, single spaces, no edge spaces.`,
                      (upd) => setFormData((prev) => ({ ...prev, ...upd }))
                    )}
                    // onBlur now does the edge‐space trim + final trailing‐space check
                    onBlur={() => {
                      const cleaned = formData[field]
                        .trim()
                        .replace(/\s+/g, " ");
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            [field]: cleaned,
                          } as ModeratorFormData)
                      );
                      if (
                        field === "email"
                          ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)
                          : !validate(cleaned, [
                              noLeadingSpace,
                              noTrailingSpace,
                              alphaSingleSpace,
                            ])
                      ) {
                        toast.error(
                          field === "email"
                            ? "Please enter a valid email address."
                            : `${label} must be letters only, single spaces, no edge spaces.`
                        );
                      }
                    }}
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
            <p className="text-sm">
              <strong>Note:</strong> All Admins can add, start, or delete
              meetings and materials, and can incur charges to your account for
              this project.
            </p>
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
