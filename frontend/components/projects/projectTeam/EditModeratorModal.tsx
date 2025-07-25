// components/projects/projectTeam/EditModeratorModal.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IModerator } from "@shared/interface/ModeratorInterface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "lib/api";
import CustomButton from "components/shared/CustomButton";

export interface EditModeratorForm {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  adminAccess: boolean;
}

interface EditModeratorModalProps {
  open: boolean;
  moderator: IModerator | null;
  onClose: () => void;
}

export default function EditModeratorModal({
  open,
  moderator,
  onClose,
}: EditModeratorModalProps) {
  const form = useForm<EditModeratorForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      adminAccess: false,
    },
  });
  const { projectId } = useParams() as { projectId: string };
  const qc = useQueryClient();

  useEffect(() => {
    if (moderator) {
      form.reset({
        firstName: moderator.firstName,
        lastName: moderator.lastName,
        email: moderator.email,
        companyName: moderator.companyName,
        adminAccess: moderator.adminAccess,
      });
    }
  }, [moderator, form]);

  // mutation to update moderator
  const editModerator = useMutation<
    IModerator,
    Error,
    { id: string; values: EditModeratorForm }
  >({
    mutationFn: ({ id, values }) =>
      api
        .put<{ data: IModerator }>(`/api/v1/moderators/${id}`, values)
        .then((res) => res.data.data),
    onSuccess: () => {
      toast.success("Moderator updated");
      qc.invalidateQueries({ queryKey: ["projectTeam", projectId] });
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  // handle form submit
  const onSubmit = form.handleSubmit((values) => {
    if (!moderator?._id) return;
    editModerator.mutate({ id: moderator._id, values });
  });

  const textFields = [
    { name: "firstName" as const, label: "First Name", type: "text" },
    { name: "lastName" as const, label: "Last Name", type: "text" },
    { name: "email" as const, label: "Email", type: "email" },
    { name: "companyName" as const, label: "Company Name", type: "text" },
  ];

  const isVerified = moderator?.isVerified;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Moderator</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            {textFields.map(({ name, label, type }) => (
              <div key={name}>
                {isVerified ? (
                  <p>
                    <span className="font-semibold">{label}:</span>{" "}
                    {moderator?.[name]}
                  </p>
                ) : (
                  <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input type={type} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}

            {/* Admin Access toggle */}
            <FormField
              control={form.control}
              name="adminAccess"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="m-0">Admin Access</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 flex justify-end space-x-2">
              <CustomButton
                variant="outline"
                onClick={() => {
                  form.reset();
                  onClose();
                }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                className="bg-custom-teal hover:bg-custom-dark-blue-3"
                disabled={editModerator.isPending}
              >
                {editModerator.isPending ? "Saving…" : "Save"}
              </CustomButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
