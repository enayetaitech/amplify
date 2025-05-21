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

export interface AddModeratorValues {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  roles: string[];
}

interface AddModeratorModalProps {
  open: boolean;
  onClose: () => void;

}

export default function AddModeratorModal({
  open,
  onClose,
  }: AddModeratorModalProps) {
  const form = useForm<AddModeratorValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      roles: [],
    },
  });
    const params = useParams();
    if (!params.projectId || Array.isArray(params.projectId)) {
      throw new Error("projectId is required and must be a string");
    }
    const projectId = params.projectId;
  // const watchedRoles = form.watch("roles");
  const queryClient = useQueryClient();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [prevRoles, setPrevRoles] = useState<string[]>([]);

   const createProjectTeamMember = useMutation({
    mutationFn: (payload: AddModeratorValues & { projectId: string }) =>
      api.post("/api/v1/moderators/add-moderator", payload),
    onSuccess: () => {
      toast.success("Moderator added!");
      queryClient.invalidateQueries({
        queryKey: ["projectTeam", projectId ],
      });
      form.reset();
      onClose();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  // const handleRoleChange = (role: string, checked: boolean) => {
  //   const current = form.getValues("roles");
  //   if (role === "Admin" && checked) {
  //     setPrevRoles(current);
  //     setPendingRole("Admin");
  //     setIsConfirmOpen(true);
  //   } else {
  //     form.setValue(
  //       "roles",
  //       checked ? [...current, role] : current.filter((r) => r !== role)
  //     );
  //   }
  // };

  const onConfirm = (yes: boolean) => {
    if (yes && pendingRole) {
      form.setValue("roles", [...prevRoles, pendingRole]);
    } else {
      form.setValue("roles", prevRoles);
    }
    setPendingRole(null);
    setIsConfirmOpen(false);
  };

   const onSubmit = form.handleSubmit((values) => {
    createProjectTeamMember.mutate({
      ...values,
      projectId,
    });
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => val || onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Moderator</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Roles */}
              <FormField
  control={form.control}
  name="roles"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <FormControl>
        <div className="space-y-2">
          {["Admin", "Moderator", "Observer"].map((role) => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                checked={field.value.includes(role)}
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
                <Button type="submit">Save</Button>
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
