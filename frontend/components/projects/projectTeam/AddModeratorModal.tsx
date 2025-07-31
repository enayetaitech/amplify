"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Checkbox } from "components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "components/ui/form";
import ConfirmationModalComponent from "components/ConfirmationModalComponent";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addModeratorSchema,
  AddModeratorValues,
} from "schemas/addModeratorSchema";
import { ALL_ROLES, textFields } from "constant";

interface AddModeratorModalProps {
  open: boolean;
  onClose: () => void;
}

type Role = z.infer<typeof addModeratorSchema>["roles"][number];

export default function AddModeratorModal({
  open,
  onClose,
}: AddModeratorModalProps) {
  const form = useForm<AddModeratorValues>({
    resolver: zodResolver(addModeratorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      roles: [],
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const params = useParams();
  if (!params.projectId || Array.isArray(params.projectId)) {
    throw new Error("projectId is required and must be a string");
  }
  const projectId = params.projectId;
  const queryClient = useQueryClient();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [prevRoles, setPrevRoles] = useState<Role[]>([]);

  const createProjectTeamMember = useMutation({
    mutationFn: (payload: AddModeratorValues & { projectId: string }) =>
      api.post("/api/v1/moderators/add-moderator", payload),
    onSuccess: () => {
      toast.success("Team member added successfully!");
      queryClient.invalidateQueries({
        queryKey: ["projectTeam", projectId],
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const onConfirm = (yes: boolean) => {
    if (yes && pendingRole) {
      form.setValue("roles", [...prevRoles, pendingRole]);
    } else {
      form.setValue("roles", prevRoles);
    }
    setPendingRole(null);
    setIsConfirmOpen(false);
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      createProjectTeamMember.mutate({
        ...values,
        projectId,
      });
    },
    (errors) => {
      // pick first error and toast it
      const firstError = Object.values(errors)[0]?.message;
      if (typeof firstError === "string") toast.error(firstError);
    }
  );

  const isSaving = createProjectTeamMember.isPending

  return (
    <>
           <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
         // if the dialog is closing…
          if (!nextOpen) {
            form.reset();
            onClose();
          }
        }}      >
        <DialogContent className="w-full max-w-2xl overflow-x-auto border-0">
          <DialogHeader>
            <DialogTitle>Add Project Team</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* First Name */}
              {textFields.map(({ name, label, type }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input type={type} placeholder={label} {...field} 
                        disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Roles */}
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {ALL_ROLES.map((role) => (
                          <div
                            key={role}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={field.value.includes(role)}
                              disabled={isSaving}
                              onCheckedChange={(checked) => {
                                // same confirm logic for Admin
                                if (role === "Admin" && checked) {
                                  setPrevRoles(field.value);
                                  setPendingRole("Admin");
                                  setIsConfirmOpen(true);
                                } else {
                                  field.onChange(
                                    checked
                                      ? [...field.value, role]
                                      : field.value.filter((r) => r !== role)
                                  );
                                }
                              }}
                            />
                            <span>{role}</span>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                disabled={isSaving}
                type="submit">  {isSaving ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationModalComponent
        open={isConfirmOpen}
        heading="Confirm Admin Role"
        text="Are you sure you want to add this person as an Admin for this project? Adding an Admin authorizes this individual to incur charges on your behalf."
        onCancel={() => onConfirm(false)}
        onYes={() => onConfirm(true)}
      />
    </>
  );
}
